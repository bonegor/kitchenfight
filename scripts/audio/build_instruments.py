#!/usr/bin/env python3
"""
KITCHEN FIGHT — sampled instrument build (Audio 2.0).

Reads recorded instrument samples straight from the local git clones listed in the Audio 2.0
brief (see scripts/audio/instrument_sources.py and docs/credits/music-samples.md), and writes

  src/audio/assets/inst/<set>/<set>.mp3   one MP3 "sprite" per sample set (mono unless noted)
  src/audio/assets/inst/manifest.ts       generated zone map (pitch, key range, velocity layer,
                                          round robin, loop points, decay, gain, onset, offsets)

Every sprite starts with an alignment marker (a single impulse at MARKER samples) so the runtime
can measure the decoder's MP3 delay/padding behaviour and place every zone sample-exactly.

Usage (from the repository root):
  /home/user/.venv-audio/bin/python scripts/audio/build_instruments.py [--cache DIR] [--only a,b] [--report FILE]

Requirements: numpy, scipy, ffmpeg with libmp3lame, git. Sources are materialised into --cache
(default: $TMPDIR/kf-instrument-cache) without touching the clones' working trees.
Deterministic: same sources + same script = same MP3s (LAME is deterministic).
"""
from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import tempfile
from dataclasses import dataclass, field
from typing import Callable

import numpy as np
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from instrument_dsp import (attack_points, crossfade_loop, db, dc_block, decode_mp3, encode_mp3, envelope,  # noqa: E402
                            fade, find_loop, flatten_loop_envelope, ftom, load_audio, loop_corr, loudness,
                            max_short_loudness, measure_pitch, measure_pitch_centroid, measure_pitch_hfit,
                            measure_pitch_hsum, measure_pitch_track, mtof, note_name, onset_index, resample, rms,
                            seam_click, to_mono)
from instrument_sources import REPOS, Region, Sources, parse_sfz  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT_DIR = os.path.join(ROOT, 'src', 'audio', 'assets', 'inst')

MARKER = 2048  # impulse position in every sprite (samples)
MARKER_AMP = 0.9
MARKER_WINDOW = MARKER + 4096  # the runtime searches [0, MARKER_WINDOW) for the impulse
DATA0 = MARKER + 6144  # first zone starts here (beyond any decoder delay + pre-echo)
GAP = 1152  # silence between zones (> MP3 pre-echo spread)
# looped zones are followed by GUARD samples of their own loop continuation (faded out): the MP3
# encoder then sees continuous audio across the loop end instead of a hard cut, whose pre-echo
# (codec noise spreading back up to a granule) would otherwise sit right before the seam and tick
# at every loop pass. The runtime never reads past the loop end.
GUARD = 384
PEAK = 10 ** (-1.5 / 20)  # sprite zones are peak-normalised to -1.5 dBFS
TARGET_LU = -20.0  # loudness every zone is normalised to (K-weighted dB), applied via zone gain


# ---------------------------------------------------------------------------------------------
# Specs
# ---------------------------------------------------------------------------------------------

@dataclass
class Cand:
    """One source sample that becomes a zone."""
    path: str  # repo-relative path
    nominal: float  # expected sounding pitch (MIDI, fractional allowed); None-like for unpitched
    layer: int = 0
    rr: int = 0
    loop: tuple[int, int] | None = None  # source-rate loop points from the SFZ
    offset: int = 0  # source-rate start offset (SFZ offset)
    gain_db: float = 0.0  # extra gain (SFZ volume)
    mix: list[tuple[str, float]] = field(default_factory=list)  # (path, gain dB) layered at onset
    label: str = ''
    pitched: bool = True
    mode: str | None = None  # per-zone override of the set mode
    t_store: float | None = None  # per-zone override
    loop_len: float | None = None
    attack: str | None = None  # per-zone override of the attack model (see attack_points)
    onset_db: float | None = None  # per-zone override of SetSpec.onset_db (swelling rolls: -20)


@dataclass
class SetSpec:
    name: str
    repo: str
    cands: Callable[[Sources], list[Cand]]
    mode: str  # 'sustain' | 'decay' | 'oneshot'
    sr: int = 32000
    channels: int = 1
    quality: float = 5.0
    pre_ms: float = 1.5  # pre-roll kept before the detected onset
    slow_onset: bool = False  # (octave vote probe only)
    # attack model (instrument_dsp.attack_points): 'transient' (default for decay / oneshot sets),
    # 'perceptual' (spread section attacks: beat on the -12 dB point, build-up kept before it),
    # 'sustain' (default for sustain sets: reference = early sustain level)
    attack: str | None = None
    onset_db: float = -12.0  # 'transient': the beat = the 2 ms envelope reaching this re the attack peak
    max_walk: float = 0.025  # 'transient': longest rise kept before the beat (s)
    perc_db: float = -10.0  # 'perceptual': the beat = the 5 ms envelope reaching this re its peak
    sus_db: float = -12.0  # 'sustain': the beat = the faded attack reaching this re the sustain level
    max_pre: float = 0.06  # 'perceptual' / 'sustain': longest build-up kept before the beat (s)
    max_attack: float | None = None  # 'sustain': cut slower attacks to reach -6 dB in this time (s)
    fade_in: float = 0.0  # 'sustain': minimum fade-in (s), e.g. chorus samples that start mid-sound
    # decay / oneshot
    t_store: float = 1.0  # seconds kept after the onset (decay: before the decay loop ends)
    loop_len: float = 0.25  # loop length target (s)
    # sustain
    loop_min: float = 0.3  # earliest loop start after onset (s)
    loop_max: float = 0.9  # latest loop start after onset (s)
    use_sfz_loop: bool = True
    max_sfz_end: float = 3.0  # use the SFZ loop only if it ends before this (s after onset)
    xfade: float = 0.06  # loop crossfade (s, capped at a third of the loop)
    loud_win: tuple[float, float] = (0.0, 0.4)  # loudness window after onset (s) when not looped
    loud_max: bool = False  # normalise on the loudest 0.3 s window instead (one-shots that build up)
    fade_out: float = 0.08
    pitch_harmonics: int = 2  # YIN fallback refinement
    partials: int = 4  # partials combined by the centroid pitch (1 for inharmonic mallets/bells)
    # 'centroid' | 'hsum' = harmonic-sum (voice ensembles) | 'hfit' = least-squares harmonic-series
    # fit over harmonics pitch_hmin..pitch_hmax (low strings with a weak fundamental) | 'strike' =
    # tubular-bell strike tone: modes 4:5:6 ~ 2:3:4 of it, an octave below the 4th mode
    pitch_method: str = 'centroid'
    pitch_hmin: int = 1
    pitch_hmax: int = 6
    pitch_win: tuple[float, float] = (0.05, 0.4)
    octave: float | None = None  # known octave correction (None = vote by measuring)
    min_decay: float = 3.0  # dB/s floor for decaying loops
    trust_below: float = -1  # zones with nominal pitch below / above these use the nominal pitch
    trust_above: float = 999  # (inharmonic instruments, piano extremes with a too weak fundamental)
    ext_down: int = 5  # key range extension below the lowest / above the highest zone
    ext_up: int = 5
    note: str = ''


NOTE_RE = re.compile(r'([A-Ga-g])([#sb]?)(-?\d)')
PCS = {'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11}


def name_to_midi(s: str, c4: int = 60) -> int:
    """Note name ('A#3', 'As3', 'Bb3', 'g+2' style handled by callers) -> MIDI, C4 = c4."""
    m = NOTE_RE.fullmatch(s.strip())
    if not m:
        raise ValueError(s)
    pc = PCS[m.group(1).lower()] + (1 if m.group(2) in ('#', 's') else -1 if m.group(2) == 'b' else 0)
    return c4 + 12 * (int(m.group(3)) - 4) + pc


# ---------------------------------------------------------------------------------------------
# Candidate lists per source
# ---------------------------------------------------------------------------------------------

def sfz_cands(name: str, sfz: str, *, octave: int = 0, keep: Callable[[Region], bool] | None = None,
              layer_of: Callable[[Region], int] | None = None, rr_of: Callable[[Region], int] | None = None,
              every: int = 1, lo: int = -1, hi: int = 999, use_volume: bool = True) -> Callable[[Sources], list[Cand]]:
    """Zones from an SFZ map (pitch_keycenter - tune/100 + octave correction = expected pitch)."""
    def f(src: Sources) -> list[Cand]:
        out: list[Cand] = []
        seen = set()
        for r in parse_sfz(src, name, sfz):
            if r.get('trigger') in ('release', 'release_key'):
                continue
            if keep and not keep(r):
                continue
            kc = r.key('pitch_keycenter', r.key('lokey', 60))
            nominal = kc - r.num('tune') / 100.0 + 12 * octave
            if nominal < lo or nominal > hi:
                continue
            key = (r.sample, layer_of(r) if layer_of else 0, rr_of(r) if rr_of else 0)
            if key in seen:
                continue
            seen.add(key)
            loop = None
            if 'loop_start' in r.opcodes and 'loop_end' in r.opcodes:
                loop = (int(r.num('loop_start')), int(r.num('loop_end')))
            out.append(Cand(path=r.sample, nominal=nominal, layer=key[1], rr=key[2], loop=loop,
                            offset=int(r.num('offset')), gain_db=r.num('volume') if use_volume else 0.0,
                            label=os.path.basename(r.sample)))
        out.sort(key=lambda c: (c.layer, c.rr, c.nominal))
        if every > 1:
            res = []
            for (l, rr) in sorted({(c.layer, c.rr) for c in out}):
                grp = [c for c in out if c.layer == l and c.rr == rr]
                res += grp[::every] if grp[-1] in grp[::every] else grp[::every] + [grp[-1]]
            out = res
        return out
    return f


def files(src: Sources, repo: str, directory: str, pattern: str) -> list[tuple[str, re.Match]]:
    """(path, match) for files directly inside `directory` whose basename matches `pattern`."""
    rx = re.compile(pattern)
    out = []
    pre = directory.rstrip('/') + '/'
    for p in src.ls(repo, pre):
        rest = p[len(pre):]
        if '/' in rest:
            continue
        m = rx.fullmatch(rest)
        if m:
            out.append((p, m))
    return sorted(out)


def thin(cands: list[Cand], every: int) -> list[Cand]:
    """Keep every n-th zone per (layer, rr) group (always keeping the top one)."""
    res = []
    for key in sorted({(c.layer, c.rr) for c in cands}):
        grp = sorted([c for c in cands if (c.layer, c.rr) == key], key=lambda c: c.nominal)
        sel = grp[::every]
        if grp[-1] not in sel:
            sel.append(grp[-1])
        res += sel
    return res


def accordion_cands(src: Sources) -> list[Cand]:
    # FreePats names its files one octave above scientific pitch (file "B3" sounds B2 = MIDI 47);
    # the SFZ keycenters are right and the measured pitch confirms them.
    return sfz_cands('accordion', 'PRESET Button Accordion HN tuned.sfz', use_volume=False)(src)


def mandolin_cands(src: Sources) -> list[Cand]:
    # Terkelsen files are named in the "C3 = middle C" convention and the SFZ maps them an octave
    # low (keycenter 43 for the G3 string): sounding pitch = keycenter + 12 (measured).
    out = []
    for r in parse_sfz(src, 'mandolin', "Terkelsen's Mandolin.sfz"):
        kc = r.key('pitch_keycenter')
        soft = r.num('hivel', 127) <= 63
        out.append(Cand(path=r.sample, nominal=kc + 12, layer=0 if soft else 1, label=os.path.basename(r.sample)))
    loud = sorted([c for c in out if c.layer == 1], key=lambda c: c.nominal)
    soft = sorted([c for c in out if c.layer == 0], key=lambda c: c.nominal)
    return loud + soft[1::2]  # loud every semitone, soft every other semitone (interleaved)


META = 'systems/instruments'


def meta_guitar_cands(kind: str, layers: list[str], step: int, lo: int, hi: int) -> Callable[[Sources], list[Cand]]:
    """Meta nylon/steel guitar: per pitch choose the string with the lowest fret (open-ish strings
    ring best), one zone every `step` semitones per layer."""
    opens = {'StringLowE': 40, 'StringA': 45, 'StringD': 50, 'StringG': 55, 'StringB': 59, 'StringHighE': 64}
    d = f'{META}/meta-{kind}-guitar/ogg'

    def f(src: Sources) -> list[Cand]:
        rx = r'INSGuitar(?:Nylon|Steel)_(String\w+?)_(Vel0\d\w*?)_([A-G]s?\d)_01\.ogg'
        avail: dict[tuple[str, int], dict[str, str]] = {}
        for p, m in files(src, 'meta', d, rx):
            avail.setdefault((m.group(2), name_to_midi(m.group(3))), {})[m.group(1)] = p
        out = []
        for li, lay in enumerate(layers):
            for midi in range(lo, hi + 1, step):
                strings = avail.get((lay, midi), {})
                if not strings:
                    continue
                best = min(strings, key=lambda st: midi - opens[st] if midi >= opens[st] else 99)
                out.append(Cand(path=strings[best], nominal=midi, layer=li, label=os.path.basename(strings[best])))
        return out
    return f


def meta_piano_cands(src: Sources) -> list[Cand]:
    out = []
    d = f'{META}/meta-piano/ogg'
    for li, vel in enumerate(['Vel02', 'Vel04']):
        for p, m in files(src, 'meta', d, rf'INSPiano_{vel}_([A-G]s?\d)_01\.ogg'):
            midi = name_to_midi(m.group(1))
            if (midi - 21) % 4 == 0 or midi == 108:
                out.append(Cand(path=p, nominal=midi, layer=li, label=os.path.basename(p)))
    return out


SSO = 'Sonatina Symphonic Orchestra'
SSOS = f'{SSO}/Samples'


def sso_cands(directory: str, pattern: str, *, layer: int = 0, rr: int = 0, lo: float = -1, hi: float = 999,
              mix: Callable[[str, re.Match], list[tuple[str, float]]] | None = None, every: int = 1,
              offset: int = 0, rr_group: int | None = None, pitched: bool = True,
              mode: str | None = None) -> Callable[[Sources], list[Cand]]:
    """SSO samples by file name (group 1 of `pattern` = note name, e.g. 'c#4'); rr_group: regex
    group holding the round-robin number (1-based)."""
    def f(src: Sources) -> list[Cand]:
        out = []
        for p, m in files(src, 'sso', f'{SSOS}/{directory}', pattern):
            midi = name_to_midi(m.group(1))
            if not lo <= midi <= hi:
                continue
            r = int(m.group(rr_group)) - 1 if rr_group else rr
            out.append(Cand(path=p, nominal=midi, layer=layer, rr=r, offset=offset, pitched=pitched, mode=mode,
                            mix=mix(p, m) if mix else [], label=os.path.basename(p)))
        return thin(out, every) if every > 1 else out
    return f


def join(*fs: Callable[[Sources], list[Cand]]) -> Callable[[Sources], list[Cand]]:
    return lambda src: [c for f in fs for c in f(src)]


def marcato(directory: str, prefix: str, gain_db: float) -> Callable[[str, re.Match], list[tuple[str, float]]]:
    """Layer the staccato rr1 sample onto a sustain sample: SSO 'marcato' (accented attack)."""
    def f(path: str, m: re.Match) -> list[tuple[str, float]]:
        return [(f'{SSOS}/{directory}/{prefix}-stc-rr1-{m.group(1)}.wav', gain_db)]
    return f


def organ_cands(src: Sources) -> list[Cand]:
    out = []
    for p, m in files(src, 'sso', f'{SSOS}/Organ/great-opendiapason8ft', r'(\d{3})-([A-G]#?)\.flac'):
        midi = int(m.group(1))
        base = os.path.basename(p)
        out.append(Cand(path=p, nominal=midi, label=base,
                        mix=[(f'{SSOS}/Organ/great-principal4ft/{base}', -4.0),
                             (f'{SSOS}/Organ/great-fifteenth2ft/{base}', -9.0)]))
    return out


VCSL_I = 'Idiophones/Struck Idiophones'
VCSL_M = 'Membranophones/Struck Membranophones'


def vc(path: str, layer: int = 0, rr: int = 0, nominal: float = 60, pitched: bool = False, gain_db: float = 0.0,
       mode: str | None = None, t_store: float | None = None, loop_len: float | None = None,
       onset_db: float | None = None) -> Cand:
    return Cand(path=path, nominal=nominal, layer=layer, rr=rr, pitched=pitched, gain_db=gain_db, mode=mode,
                t_store=t_store, loop_len=loop_len, onset_db=onset_db, label=os.path.basename(path))


def harpsichord_cands(src: Sources) -> list[Cand]:
    # VCSL names these one octave below the sounding pitch (measured: +12)
    d = 'Chordophones/Zithers/Harpsichord, Italian/Sustains/stop1'
    out = []
    for p, m in files(src, 'vcsl', d, r'Harpsichord_stop1_([A-G]#?\d)_1\.wav'):
        out.append(Cand(path=p, nominal=name_to_midi(m.group(1)), label=os.path.basename(p)))
    return thin(out, 2)


def fixed(cs: list[Cand]) -> Callable[[Sources], list[Cand]]:
    return lambda src: cs


def gleitz_cands(inst: str, notes: list[str], font: str = 'MusyngKite') -> Callable[[Sources], list[Cand]]:
    def f(src: Sources) -> list[Cand]:
        return [Cand(path=f'{font}/{inst}-mp3/{n}.mp3', nominal=name_to_midi(n), label=f'{inst}/{n}') for n in notes]
    return f


# ---------------------------------------------------------------------------------------------
# Set table
# ---------------------------------------------------------------------------------------------

SETS: list[SetSpec] = [
    # --- plucked / keyboard -------------------------------------------------------------------
    SetSpec('accordion', 'accordion', accordion_cands, 'sustain', quality=4, pre_ms=3, octave=0, max_attack=0.07,
            use_sfz_loop=True, max_sfz_end=2.6, xfade=0.03, pitch_harmonics=1, ext_up=5,
            note='FreePats Hohner button accordion, SFZ loop points (musette beat cycles)'),
    SetSpec('mandolin', 'mandolin', mandolin_cands, 'decay', quality=4, octave=0, t_store=0.7, loop_len=0.12,
            loud_win=(0.0, 0.25), min_decay=8, note="Terkelsen's mandolin, 2 velocity layers"),
    SetSpec('guitar', 'meta', meta_guitar_cands('nylon', ['Vel01Finger', 'Vel03Pick'], 3, 40, 83), 'decay',
            quality=4.5, octave=0, t_store=0.95, loop_len=0.16, loud_win=(0.0, 0.3), min_decay=4,
            note='Meta nylon guitar: fingerstyle + firm pick layers'),
    SetSpec('steelguitar', 'meta', meta_guitar_cands('steel', ['Vel02'], 3, 40, 84), 'decay',
            quality=5, octave=0, t_store=0.95, loop_len=0.16, loud_win=(0.0, 0.3), min_decay=4),
    SetSpec('piano', 'meta', meta_piano_cands, 'decay', partials=2, quality=4.5, octave=0, t_store=0.9, loop_len=0.2,
            loud_win=(0.0, 0.4), min_decay=2, pitch_harmonics=1, ext_down=3, ext_up=3, trust_below=40,
            note='Meta upright piano: mp + ff layers, a zone every major third'),
    SetSpec('harpsichord', 'vcsl', harpsichord_cands, 'decay', quality=5, t_store=0.8, loop_len=0.12,
            loud_win=(0.0, 0.3), min_decay=4, note='VCSL Italian harpsichord (stop 1)'),
    SetSpec('harp', 'sso', sso_cands('Harp', r'harp-([a-g]#?\d)\.wav'), 'decay', quality=5, t_store=1.0,
            loop_len=0.2, loud_win=(0.0, 0.3), min_decay=3),
    # --- strings -------------------------------------------------------------------------------
    SetSpec('violin', 'sso', sso_cands('Violin', r'violin-([a-g]#?\d)\.wav'), 'sustain', quality=4.5,
            pre_ms=5, slow_onset=True, max_attack=0.08, loop_min=0.45, loop_max=0.95, loop_len=0.55, xfade=0.09,
            note='SSO solo violin 1 (vibrato), own loops'),
    SetSpec('strings', 'sso', join(sso_cands('1st Violins', r'1st-violins-sus-([a-g]#?\d)\.wav'),
                                   sso_cands('Celli', r'celli-sus-([a-g]#?\d)\.(?:wav|flac)', hi=54)), 'sustain',
            quality=5, pre_ms=8, slow_onset=True, max_attack=0.12, loop_min=0.5, loop_max=1.0, loop_len=0.6, xfade=0.12,
            note='SSO 1st violins + celli sustain'),
    SetSpec('strstab', 'sso', join(
        sso_cands('1st Violins', r'1st-violins-stc-rr1-([a-g]#?\d)\.wav', rr=0),
        sso_cands('1st Violins', r'1st-violins-stc-rr2-([a-g]#?\d)\.wav', rr=1),
        sso_cands('Celli', r'celli-stc-rr1-([a-g]#?\d)\.wav', rr=0, hi=54),
        sso_cands('Celli', r'celli-stc-rr2-([a-g]#?\d)\.wav', rr=1, hi=54)),
            'oneshot', quality=5, t_store=0.42, fade_out=0.1, loud_win=(0.0, 0.15), pitch_win=(0.03, 0.2),
            attack='perceptual', note='SSO 1st violins + celli staccato, 2 round robins'),
    SetSpec('pizz', 'sso', join(sso_cands('1st Violins', r'1st-violins-piz-rr1-([a-g]#?\d)\.wav', rr=0),
                                sso_cands('1st Violins', r'1st-violins-piz-rr2-([a-g]#?\d)\.wav', rr=1),
                                sso_cands('Celli', r'celli-piz-rr1-([a-g]#?\d)\.wav', rr=0, hi=54),
                                sso_cands('Celli', r'celli-piz-rr2-([a-g]#?\d)\.wav', rr=1, hi=54)),
            'oneshot', quality=5, t_store=0.6, fade_out=0.15, loud_win=(0.0, 0.2), pitch_win=(0.02, 0.15),
            attack='perceptual',
            note='SSO 1st violins + celli pizzicato, 2 round robins (rr2 files are a semitone off their names: measured)'),
    SetSpec('ubass', 'sso', join(sso_cands('Bass', r'bass-piz-rr\d-([a-g]#?\d)\.flac')), 'decay', sr=24000, quality=5,
            t_store=0.85, loop_len=0.15, loud_win=(0.0, 0.3), min_decay=4, pitch_harmonics=1,
            pitch_method='hfit', pitch_hmin=2, pitch_hmax=6, pitch_win=(0.05, 0.6),
            note='SSO solo double bass pizzicato; pitch by a harmonic-series fit over harmonics 2-6 (the fundamental '
                 'of the low strings is 30-40 dB under the 2nd harmonic)'),
    SetSpec('cello', 'sso', sso_cands('Cello', r'cello-([a-g]#?\d)\.(?:wav|flac)'), 'sustain', quality=5,
            pre_ms=5, slow_onset=True, max_attack=0.1, loop_min=0.45, loop_max=0.9, loop_len=0.5, xfade=0.09),
    SetSpec('contrabass', 'sso', sso_cands('Basses', r'basses-sus-([a-g]#?\d)\.wav'), 'sustain', sr=24000, quality=5.5,
            pre_ms=8, slow_onset=True, max_attack=0.12, loop_min=0.5, loop_max=1.0, loop_len=0.5, xfade=0.1,
            pitch_harmonics=1),
    # --- brass ---------------------------------------------------------------------------------
    SetSpec('brass', 'sso', join(
        sso_cands('Trumpets', r'trumpets-sus-([a-g]#?\d)\.wav', mix=marcato('Trumpets', 'trumpets', -2.0)),
        sso_cands('Trombones', r'trombones-sus-([a-g]#?\d)\.wav', hi=51, mix=marcato('Trombones', 'trombones', -2.0))),
            'sustain', quality=5, pre_ms=3, loop_min=0.35, loop_max=0.8, loop_len=0.4, xfade=0.08,
            note='SSO trumpets/trombones: sustain + staccato premix (marcato)'),
    SetSpec('horns', 'sso', sso_cands('Horns', r'horns-sus-mp-([a-g]#?\d)-PB-loop\.wav'), 'sustain', quality=5.5,
            pre_ms=6, slow_onset=True, loop_min=0.45, loop_max=0.9, loop_len=0.45, xfade=0.1),
    SetSpec('tuba', 'sso', sso_cands('Tuba', r'tuba-sus-([a-g]#?\d)\.wav', mix=marcato('Tuba', 'tuba', -1.0)),
            'sustain', sr=24000, quality=5.5, pre_ms=3, loop_min=0.3, loop_max=0.7, loop_len=0.35, xfade=0.08,
            pitch_harmonics=1, note='SSO tuba sustain + staccato premix'),
    SetSpec('trumpet', 'sso', sso_cands('Trumpet', r'trumpet-([a-g]#?\d)\.wav'), 'sustain', quality=5,
            pre_ms=3, loop_min=0.35, loop_max=0.8, loop_len=0.4, xfade=0.08),
    SetSpec('trombone', 'sso', sso_cands('Tenor Trombone', r'tenor_trombone-([a-g]#?\d)\.wav'), 'sustain',
            quality=5, pre_ms=3, loop_min=0.35, loop_max=0.8, loop_len=0.4, xfade=0.08),
    SetSpec('horn', 'sso', sso_cands('Horn', r'horn-([a-g]#?\d)\.wav'), 'sustain', quality=5, pre_ms=4,
            loop_min=0.35, loop_max=0.8, loop_len=0.4, xfade=0.08),
    # --- woodwinds -----------------------------------------------------------------------------
    SetSpec('flute', 'sso', sso_cands('Flute', r'flute-([a-g]#?\d)\.wav'), 'sustain', quality=5, pre_ms=4,
            max_attack=0.08, loop_min=0.35, loop_max=0.8, loop_len=0.45, xfade=0.09),
    SetSpec('piccolo', 'sso', sso_cands('Piccolo', r'piccolo-([a-g]#?\d)\.wav'), 'sustain', quality=5,
            pre_ms=3, loop_min=0.3, loop_max=0.7, loop_len=0.4, xfade=0.08),
    SetSpec('clarinet', 'sso', sso_cands('Clarinet', r'clarinet-([a-g]#?\d)\.wav'), 'sustain', quality=5,
            pre_ms=4, loop_min=0.35, loop_max=0.8, loop_len=0.4, xfade=0.08),
    SetSpec('oboe', 'sso', sso_cands('Oboe', r'oboe-([a-g]#?\d)\.wav'), 'sustain', quality=5, pre_ms=4,
            loop_min=0.35, loop_max=0.8, loop_len=0.4, xfade=0.08),
    SetSpec('bassoon', 'sso', sso_cands('Bassoon', r'bassoon-([a-g]#?\d)\.wav'), 'sustain', sr=24000, quality=5.5,
            pre_ms=4, loop_min=0.35, loop_max=0.8, loop_len=0.4, xfade=0.08, pitch_harmonics=1),
    # --- voices / organ ------------------------------------------------------------------------
    SetSpec('choir', 'sso', sfz_cands('sso', f'{SSO}/Chorus - Performance/Mixed Chorus.sfz', every=2, use_volume=False),
            'sustain', quality=5, pre_ms=10, slow_onset=True, loop_min=0.35, loop_max=0.9, loop_len=0.6, xfade=0.15,
            octave=0, pitch_method='hsum', fade_in=0.15, max_pre=0.06, ext_up=7,
            note='SSO mixed chorus "aah", every other semitone, attack offset as in the SFZ (the zones start '
                 'mid-sound: the SFZ ampeg_attack is applied as a 0.15 s fade-in); pitch by harmonic sum '
                 '(the SFZ tune values are off by up to 45 cents on the male chorus)'),
    SetSpec('organ', 'sso', organ_cands, 'sustain', quality=5, pre_ms=3, octave=0, max_attack=0.12, loop_min=0.3, loop_max=0.7,
            loop_len=0.3, xfade=0.05, note="SSO pipe organ: open diapason 8' + principal 4' + fifteenth 2'"),
    # --- mallets / bells -----------------------------------------------------------------------
    SetSpec('glock', 'sso', sso_cands('Percussion', r'glockenspiel-([a-g]#?\d)\.wav'), 'decay', partials=1, quality=5,
            t_store=0.7, loop_len=0.08, loud_win=(0.0, 0.3), min_decay=3, pitch_harmonics=1),
    SetSpec('xylophone', 'sso', sso_cands('Percussion', r'xylophone-([a-g]#?\d)\.wav'), 'oneshot', partials=1, quality=5,
            t_store=0.45, fade_out=0.1, loud_win=(0.0, 0.15), pitch_harmonics=1),
    SetSpec('vibes', 'sso', sso_cands('Vibraphone', r'vibraphone-([a-g]#?\d)\.flac'), 'decay', partials=1, quality=5,
            t_store=1.1, loop_len=0.2, loud_win=(0.0, 0.4), min_decay=2, pitch_harmonics=1),
    SetSpec('celesta', 'sso', join(sso_cands('Celeste', r'celeste-([a-g]#?\d)-hard\.flac', layer=1),
                                   sso_cands('Celeste', r'celeste-([a-g]#?\d)-soft\.flac', layer=0, every=2)),
            'decay', partials=1, quality=5, t_store=0.7, loop_len=0.1, loud_win=(0.0, 0.3), min_decay=3, pitch_harmonics=1),
    SetSpec('chimes', 'sso', sso_cands('Percussion', r'chimes-([a-g]#?\d)\.wav', every=2), 'decay', partials=1, quality=5.5,
            t_store=1.8, loop_len=0.3, loud_win=(0.0, 0.5), min_decay=2, pitch_harmonics=1, octave=12,
            pitch_method='strike', ext_down=7,
            note='SSO chimes (tubular bells), mapped by their strike tone: modes 4:5:6 of each bell are ~2:3:4 '
                 '(measured); the strike tone, an octave below the 4th mode, is an octave above the file names '
                 '("chimes-c4" strikes C5 -24 cents)'),
    SetSpec('timpani', 'sso', sfz_cands('sso', f'{SSO}/Percussion/Timpani.sfz',
                                        keep=lambda r: re.search(r'timpani-(f-lh|f-rh|p-lh)-', r.sample) is not None,
                                        layer_of=lambda r: 1 if '-f-' in r.sample else 0,
                                        rr_of=lambda r: 1 if '-rh-' in r.sample else 0, use_volume=False),
            'decay', partials=1, quality=5.5, t_store=1.0, loop_len=0.25, loud_win=(0.0, 0.3), min_decay=4, pitch_harmonics=1,
            octave=0, trust_above=-1,
            note='SSO timpani: forte (2 round robins) + piano layers; pitch = SFZ keycenter + tune (inharmonic)'),
    # --- unpitched percussion ------------------------------------------------------------------
    SetSpec('tamb', 'vcsl', fixed([
        vc(f'{VCSL_I}/Tambourine 1/Tamb1_Hit_v1_rr1_Mid.wav', rr=0), vc(f'{VCSL_I}/Tambourine 2/Tamb2_Hit_v1_rr1_Mid.wav', rr=1),
        vc(f'{VCSL_I}/Tambourine 1/Tamb1_Shake_rr1_Mid.wav', rr=2), vc(f'{VCSL_I}/Tambourine 1/Tamb1_Shake_rr2_Mid.wav', rr=3),
        vc(f'{VCSL_I}/Tambourine 1/Tamb1_Hit_v2_rr1_Mid.wav', rr=4), vc(f'{VCSL_I}/Tambourine 2/Tamb2_Hit_v2_rr2_Mid.wav', rr=5),
        vc(f'{VCSL_I}/Tambourine 1/Tamb1_Roll_v2_rr1_Mid.wav', rr=6, t_store=0.7, onset_db=-20),
        vc(f'{VCSL_I}/Tambourine 2/Tamb2_Roll_v2_rr1_Mid.wav', rr=7, t_store=0.7, onset_db=-20)]),
            'oneshot', sr=44100, quality=5, t_store=0.45, fade_out=0.1, loud_win=(0.0, 0.12), octave=0, loud_max=True,
            note='VCSL tambourines: hit, shake, accent, roll (2 takes each) = synth variant semantics'),
    SetSpec('snare', 'vcsl', fixed([
        vc(f'{VCSL_M}/Snare Drum, Rope Tension/Hi/RopeSnare_hi_sn_Main_vl{v}_rr{r}.wav', layer=v - 1, rr=i)
        for v, rrs in ((1, (1, 2)), (2, (1, 2)), (3, (1, 3)), (4, (1, 2))) for i, r in enumerate(rrs)]),
            'oneshot', sr=44100, quality=5, t_store=0.5, fade_out=0.12, loud_win=(0.0, 0.1), octave=0,
            note='VCSL rope-tension snare (high), 4 dynamics x 2 round robins'),
    SetSpec('crash', 'vcsl', fixed([
        vc(f'{VCSL_I}/Clash Cymbals 1/cymbal_crash1_mf1.wav', 0, 0), vc(f'{VCSL_I}/Clash Cymbals 1/cymbal_crash1_mf2.wav', 0, 1),
        vc(f'{VCSL_I}/Clash Cymbals 1/cymbal_crash1_ff2.wav', 1, 0), vc(f'{VCSL_I}/Clash Cymbals 1/cymbal_crash1_ff3.wav', 1, 1)]),
            'decay', sr=44100, quality=5, t_store=1.4, loop_len=0.35, loud_win=(0.0, 0.5), min_decay=4, octave=0,
            loud_max=True, note='VCSL clash cymbals (piatti); stereo at runtime: the two takes of a dynamic play left / right'),
    SetSpec('kick', 'vcsl', fixed([
        vc(f'{VCSL_M}/Bass Drum 1/BDrumNew_hit_v{v}_rr{r}_Sum.wav', layer=li, rr=r - 1)
        for li, v in enumerate((3, 5, 7)) for r in (1, 2)]),
            'oneshot', sr=24000, quality=5.5, t_store=0.8, fade_out=0.2, loud_win=(0.0, 0.2), octave=0,
            note='VCSL orchestral bass drum, 3 dynamics x 2 round robins'),
    SetSpec('triangle', 'vcsl', fixed([
        vc(f'{VCSL_I}/Triangles/Triangle1_Hit_v1_rr1_Mid.wav', 0, 0), vc(f'{VCSL_I}/Triangles/Triangle1_Hit_v1_rr2_Mid.wav', 0, 1),
        vc(f'{VCSL_I}/Triangles/Triangle1_Hit_v2_rr1_Mid.wav', 1, 0), vc(f'{VCSL_I}/Triangles/Triangle1_Hit_v2_rr2_Mid.wav', 1, 1)]),
            'decay', sr=44100, quality=5, t_store=0.9, loop_len=0.2, loud_win=(0.0, 0.4), min_decay=3, octave=0, loud_max=True),
    SetSpec('shaker', 'vcsl', fixed([
        vc(f'{VCSL_I}/Shaker, Small/Mid_ShakerHighFaster_Down_rr1.wav', rr=0),
        vc(f'{VCSL_I}/Shaker, Small/Mid_ShakerHighFaster_Up_rr1.wav', rr=1),
        vc(f'{VCSL_I}/Shaker, Small/Mid_ShakerHighFaster_Down_rr2.wav', rr=2),
        vc(f'{VCSL_I}/Shaker, Small/Mid_ShakerHighFaster_Up_rr2.wav', rr=3)]),
            'oneshot', sr=44100, quality=5.5, t_store=0.3, fade_out=0.08, loud_win=(0.0, 0.12), octave=0, onset_db=-20),
    SetSpec('panclang', 'vcsl', fixed([
        vc(f'{VCSL_I}/Brake Drum/BrakeDrum1_Hammer_v2_rr1_Mid.wav', 0, 0), vc(f'{VCSL_I}/Brake Drum/BrakeDrum2_Hammer3_v2_rr1_Mid.wav', 0, 1),
        vc(f'{VCSL_I}/Brake Drum/BrakeDrum1_Hammer_v3_rr1_Mid.wav', 1, 0), vc(f'{VCSL_I}/Brake Drum/BrakeDrum2_Hammer3_v3_rr1_Mid.wav', 1, 1)]),
            'decay', quality=5, t_store=0.8, loop_len=0.15, loud_win=(0.0, 0.3), min_decay=6, octave=0, loud_max=True,
            note='VCSL brake drums struck with a hammer (frying-pan clang)'),
    SetSpec('anvil', 'vcsl', fixed([
        vc(f'{VCSL_I}/Anvil/Anvil_Hit{h}_v{v}_rr1_Mid.wav', layer=v - 1, rr=h - 1) for h in (1, 2) for v in (1, 2, 3)]),
            'decay', quality=5, t_store=0.9, loop_len=0.15, loud_win=(0.0, 0.3), min_decay=5, octave=0, loud_max=True),
    SetSpec('castanets', 'worldperc', fixed([
        vc(f'samples/Castanets/{n:02d}.flac', rr=i) for i, n in enumerate((1, 4, 7, 10))]),
            'oneshot', quality=5.5, t_store=0.22, fade_out=0.05, loud_win=(0.0, 0.08), octave=0),
    SetSpec('slapstick', 'vcsl', fixed([
        vc(f'{VCSL_I}/Slapstick/slapstick_quiet_rr1.wav', 0, 0), vc(f'{VCSL_I}/Slapstick/slapstick_quiet_rr2.wav', 0, 1),
        vc(f'{VCSL_I}/Slapstick/slapstick_rr1.wav', 1, 0), vc(f'{VCSL_I}/Slapstick/slapstick_rr2.wav', 1, 1)]),
            'oneshot', quality=5.5, t_store=0.35, fade_out=0.08, loud_win=(0.0, 0.08), octave=0),
    SetSpec('woodblock', 'vcsl', fixed([
        vc(f'{VCSL_I}/Woodblock/wood_click_pp_rr1.wav', 0, 0), vc(f'{VCSL_I}/Woodblock/wood_click_pp_rr2.wav', 0, 1),
        vc(f'{VCSL_I}/Woodblock/wood_click_f_rr1.wav', 1, 0), vc(f'{VCSL_I}/Woodblock/wood_click_f_rr2.wav', 1, 1)]),
            'oneshot', quality=5.5, t_store=0.3, fade_out=0.08, loud_win=(0.0, 0.08), octave=0),
    SetSpec('vibraslap', 'vcsl', fixed([
        vc(f'{VCSL_I}/Vibraslap/Legacy/vibraslap_rr{r}.wav', rr=r - 1) for r in (1, 2)]),
            'oneshot', quality=5.5, t_store=1.2, fade_out=0.3, loud_win=(0.0, 0.3), octave=0, onset_db=-20, loud_max=True),
    SetSpec('flexatone', 'vcsl', fixed([
        vc(f'{VCSL_I}/Flexatone/flexatone1.wav', rr=0), vc(f'{VCSL_I}/Flexatone/flexatone2.wav', rr=1),
        vc(f'{VCSL_I}/Flexatone/flexatone_fast.wav', rr=2), vc(f'{VCSL_I}/Flexatone/flexatone_long.wav', rr=3, t_store=2.2)]),
            'oneshot', quality=5.5, t_store=1.4, fade_out=0.3, loud_win=(0.0, 0.4), octave=0, onset_db=-20, loud_max=True),
    SetSpec('cymbal', 'vcsl', fixed([
        vc(f'{VCSL_I}/Suspended Cymbal 1/susCymb1_hit_mp1.wav', 0, 0), vc(f'{VCSL_I}/Suspended Cymbal 1/susCymb1_hit_f1.wav', 1, 0),
        vc(f'{VCSL_I}/Suspended Cymbal 1/susCymb1_roll_f1_nloop.wav', 0, 1, mode='sustain', loop_len=0.6, onset_db=-20)]),
            'decay', sr=44100, channels=2, quality=5, t_store=1.5, loop_len=0.35, loud_win=(0.0, 0.5), min_decay=3, octave=0,
            loud_max=True, loop_min=0.9, loop_max=1.6, xfade=0.2,
            note='VCSL suspended cymbal: hits + looped roll (variant 1), stereo (one take per articulation)'),
    SetSpec('bassdrum', 'vcsl', fixed([
        vc(f'{VCSL_M}/Bass Drum 2/bassdrum_hit_mf1.wav', 0, 0), vc(f'{VCSL_M}/Bass Drum 2/bassdrum_hit_f.wav', 1, 0),
        vc(f'{VCSL_M}/Bass Drum 2/bassdrum_hit_ff.wav', 2, 0),
        vc(f'{VCSL_M}/Bass Drum 2/bassdrum_roll_mf.wav', 0, 1, mode='sustain', loop_len=0.5, onset_db=-20)]),
            'decay', sr=24000, quality=5.5, t_store=1.2, loop_len=0.3, loud_win=(0.0, 0.4), min_decay=4, octave=0, loud_max=True,
            loop_min=0.8, loop_max=1.6, xfade=0.15, note='VCSL concert bass drum: hits + looped roll (variant 1)'),
    SetSpec('tamtam', 'sso', fixed([
        Cand(path=f'{SSOS}/Percussion/tamtam-a.wav', nominal=60, pitched=False, label='tamtam-a'),
        Cand(path=f'{SSOS}/Percussion/tamtam-b.wav', nominal=60, rr=1, pitched=False, label='tamtam-b')]),
            'decay', quality=5.5, t_store=1.8, loop_len=0.5, loud_win=(0.0, 0.8), min_decay=1.5, octave=0, onset_db=-20,
            loud_max=True, note='SSO tam-tam; stereo at runtime: the two takes play left / right'),
    SetSpec('claves', 'vcsl', fixed([
        vc(f'{VCSL_I}/Claves/Claves{c}_Hit_v{v}_rr1_Mid.wav', layer=li, rr=c - 1) for c in (1, 2) for li, v in enumerate((1, 3))]),
            'oneshot', quality=5.5, t_store=0.25, fade_out=0.06, loud_win=(0.0, 0.06), octave=0),
    SetSpec('ratchet', 'vcsl', fixed([
        vc(f'{VCSL_I}/Ratchet/Ratchet1_Fast_rr1_Mid.wav', rr=0), vc(f'{VCSL_I}/Ratchet/Ratchet1_Slow_rr1_Mid.wav', rr=1),
        vc(f'{VCSL_I}/Ratchet/Ratchet2_Crank_v1_rr1_Mid.wav', rr=2)]),
            'oneshot', quality=5.5, t_store=1.2, fade_out=0.25, loud_win=(0.0, 0.4), octave=0, onset_db=-20, loud_max=True),
    SetSpec('toywhistle', 'vcsl', fixed([
        vc(f'Aerophones/Edge-blown Aerophones/Train Whistle, Toy/Main_Train{n}-001.wav', rr=i)
        for i, n in enumerate(('Low_Short', 'Med_Short', 'Low_Double', 'Low_Fall'))]),
            'oneshot', quality=5.5, t_store=1.4, fade_out=0.25, loud_win=(0.0, 0.4), octave=0, onset_db=-20, loud_max=True),
    SetSpec('orchhit', 'gleitz', gleitz_cands('orchestra_hit', ['C3', 'Gb3', 'C4', 'Gb4', 'C5', 'Gb5']), 'oneshot',
            partials=1, quality=5, t_store=0.9, fade_out=0.25, loud_win=(0.0, 0.25), pitch_harmonics=1, octave=0,
            attack='perceptual',
            note='MusyngKite GM orchestra hit (CC BY-SA 3.0)'),
]


# ---------------------------------------------------------------------------------------------
# Zone processing
# ---------------------------------------------------------------------------------------------

@dataclass
class Zone:
    cand: Cand
    audio: np.ndarray  # (ch, n) at set sr, peak-normalised
    pitch: float
    pre: int
    loop: tuple[int, int] | None
    decay: float  # dB/s after loop start (decaying loops)
    gain: float  # linear gain to TARGET_LU
    lu: float
    info: dict


def period_of(pitch: float, sr: int) -> float:
    return sr / mtof(pitch)


def measure_zone_pitch(spec: SetSpec, x: np.ndarray, sr: int, w0: int, w1: int, nominal: float,
                       span: float, info: dict) -> float | None:
    """Pitch of a zone segment by the set's method (fractional MIDI or None), as a frame-wise track
    (energy-weighted mean of the frames: vibrato and intonation drift are averaged like the ear does):
    harmonic tones by a harmonic-comb fit per frame, inharmonic idiophones by their fundamental
    mode's centroid; 'hfit' (low strings) and 'strike' (tubular bells) measure the whole window.
    The analysis (analyze_instruments.py) measures rendered notes with this same function."""
    if spec.pitch_method == 'hfit':
        pm, inf = measure_pitch_hfit(x, sr, w0, w1, nominal, span=span, hmin=spec.pitch_hmin, hmax=spec.pitch_hmax)
        # cross-check: the same fit including the fundamental (disagreement = weak/noisy h1)
        p1, inf1 = measure_pitch_hfit(x, sr, w0, w1, nominal, span=span, hmin=1, hmax=1)
        info['levels'] = inf.get('levels')
        if pm is not None and p1 is not None:
            info['h1_vs_fit_cents'] = round((p1 - pm) * 100, 1)
        return pm
    if spec.pitch_method == 'strike':
        # tubular bell: modes 4, 5, 6 sit near 2, 3, 4 x the strike tone; the strike tone is
        # conventionally an octave below the 4th mode (the bell maker tunes that mode)
        p4 = measure_pitch_centroid(x, sr, w0, w1, nominal + 12, span=span, harmonics=1)
        return None if p4 is None else p4 - 12
    if spec.pitch_method == 'hsum' or spec.partials > 1:
        # harmonic tones (strings, winds, brass, voices, plucked strings): per frame the harmonic
        # comb that fits the spectrum best (no peak-prominence test: vibrato smears the partials of
        # a short frame, and a frame that cannot be measured must not drop out of the mean)
        # (piano: 2 harmonics — its stretched partials would pull a long comb sharp)
        sp = min(span, 1.0)
        nh = 8 if spec.partials >= 4 or spec.pitch_method == 'hsum' else max(2, spec.partials)
        meth = lambda y, r, a, b, e: measure_pitch_hsum(y, r, a, b, e, span=sp, harmonics=nh)  # noqa: E731
        frame = 0.1
    else:
        # inharmonic idiophones (one partial: the fundamental mode). A frame must resolve the mode
        # inside the +-span search band (Blackman-Harris main lobe +-4 bins): about 12 / band width,
        # i.e. the whole window for the low bars (two modes 9 Hz apart at G4 on the xylophone)
        meth = lambda y, r, a, b, e: measure_pitch_centroid(y, r, a, b, e, span=span, harmonics=spec.partials)  # noqa: E731
        frame = max(0.08, 12.0 / (mtof(nominal) * (2 ** (span / 12) - 1)))
    pm, tinf = measure_pitch_track(x, sr, w0, w1, nominal, meth, frame=frame)
    if tinf.get('spread') is not None:
        info['pitch_spread'] = tinf['spread']
    return pm


def process_zone(spec: SetSpec, src: Sources, c: Cand, octave_shift: float) -> Zone:
    path = src.fetch(spec.repo, [c.path])[0]
    x, sr0 = load_audio(path, mono=spec.channels == 1)
    if spec.channels == 2 and x.shape[0] == 1:
        x = np.vstack([x, x])
    x = dc_block(x, sr0)  # DC / sub-audio offset (some SSO brass files carry -20 dB of DC)
    if c.gain_db:
        x = x * 10 ** (c.gain_db / 20)
    for mp, mg in c.mix:  # layered premix (e.g. marcato = sustain + staccato accent)
        y, _ = load_audio(src.fetch(spec.repo, [mp])[0], sr=sr0, mono=spec.channels == 1)
        if spec.channels == 2 and y.shape[0] == 1:
            y = np.vstack([y, y])
        y = dc_block(y, sr0)
        oy = onset_index(y, sr0)
        ox = onset_index(x, sr0, slow=spec.slow_onset)
        y = y[:, oy:]
        n = min(x.shape[1] - ox, y.shape[1])
        x = x.copy()
        x[:, ox:ox + n] += y[:, :n] * 10 ** (mg / 20)
    loop_src = c.loop
    if c.offset:
        x = x[:, c.offset:]
        if loop_src:
            loop_src = (loop_src[0] - c.offset, loop_src[1] - c.offset)
    # resample to the set rate
    sr = spec.sr
    if sr0 != sr:
        x = resample(x, sr0, sr)
        if loop_src:
            loop_src = (int(round(loop_src[0] * sr / sr0)), int(round(loop_src[1] * sr / sr0)))
    info: dict = {'src_sr': sr0}
    mode = c.mode or spec.mode
    t_store = c.t_store or spec.t_store
    loop_len = c.loop_len or spec.loop_len
    # attack: zone start (pre-noise dropped), beat position, fade-in
    amode = c.attack or spec.attack or ('sustain' if mode == 'sustain' else 'transient')
    per0 = sr / mtof(c.nominal + octave_shift) if c.pitched else None
    st, on, fin, ainfo = attack_points(x, sr, amode, pre_ms=spec.pre_ms, max_walk=spec.max_walk,
                                       rel_db=c.onset_db if c.onset_db is not None else spec.onset_db,
                                       perc_db=spec.perc_db, max_pre=spec.max_pre,
                                       sus_db=c.onset_db if c.onset_db is not None else spec.sus_db,
                                       max_attack=spec.max_attack, fade_in=spec.fade_in, period=per0)
    info.update(ainfo)
    x = x[:, st:]
    pre = on - st
    if loop_src:
        loop_src = (loop_src[0] - st, loop_src[1] - st)
    info['onset_ms'] = on * 1000 / sr
    info['pre_ms'] = round(pre * 1000 / sr, 1)

    # pitch
    nominal = c.nominal + octave_shift
    pitch = nominal
    if c.pitched and (nominal < spec.trust_below or nominal > spec.trust_above):
        info['trusted'] = True
        pm = measure_pitch(x, sr, pre + int(spec.pitch_win[0] * sr), min(x.shape[1], pre + int(spec.pitch_win[1] * sr)),
                           nominal_midi=nominal, harmonics=spec.pitch_harmonics)
        info['measured'] = pm
    elif c.pitched:
        w0 = pre + int(spec.pitch_win[0] * sr)
        w1 = pre + int(spec.pitch_win[1] * sr)
        if mode == 'sustain' and loop_src and loop_src[1] <= x.shape[1] and loop_src[0] > pre:
            w0, w1 = loop_src
        elif mode == 'sustain':
            w0, w1 = pre + int(spec.loop_min * sr), min(x.shape[1], pre + int((spec.loop_max + 0.5) * sr))
        w1 = min(w1, x.shape[1])
        # precise pitch near the expected (octave-corrected) pitch; the file name / SFZ key is only
        # trusted to +-1.4 semitones (some sources are mislabelled)
        pm = measure_zone_pitch(spec, x, sr, w0, w1, nominal, 1.4, info)
        info['measured'] = pm
        if pm is None:
            # no clean partial: free detector restricted to the expected octave
            pm = measure_pitch(x, sr, w0, w1, nominal_midi=nominal, harmonics=spec.pitch_harmonics)
            info['yin'] = pm
        if pm is not None and abs(pm - nominal) <= 1.5:
            pitch = pm
            if abs(pitch - nominal) > 0.6:
                info['relabeled'] = round(pitch - nominal, 2)  # sample is off its file name/SFZ key
        else:
            info['pitch_fallback'] = None if pm is None else round(pm, 2)
    info['nominal'] = nominal

    loop = None
    decay = 0.0
    n_keep = x.shape[1]
    per = period_of(pitch, sr) if c.pitched else None
    if mode == 'sustain':
        use_sfz = (spec.use_sfz_loop and loop_src and loop_src[1] <= min(x.shape[1], pre + spec.max_sfz_end * sr)
                   and loop_src[0] > pre + fin)
        if use_sfz:
            ls, le = loop_src
            corr = loop_corr(x, sr, ls, le)
            info['loop'] = 'sfz'
        else:
            L = int(loop_len * sr)
            if per:
                L = int(round(max(1, round(L / per)) * per))
            span = max(0.15 * L, 1.2 * per) if per else 0.15 * L
            # waveform correlation, then envelope match (+-60 ms) so the seam joins equal levels
            ls, le, corr = find_loop(x, sr, pre + fin + int(spec.loop_min * sr), pre + fin + int(spec.loop_max * sr),
                                     int(L - span), int(L + span), n_starts=24, env_ctx=0.06, env_k=0.06)
            info['loop'] = 'found'
        info['loop_corr'] = round(corr, 4)
        xf = int(min(spec.xfade * sr, (le - ls) / 3))
        x = crossfade_loop(x, ls, le, xf)
        # the loop (as it plays: after the crossfade) is what long notes sound like: (re)measure the
        # pitch over it
        if c.pitched and not info.get('trusted') and 'pitch_fallback' not in info and le - ls > int(0.15 * sr):
            linfo: dict = {}
            pl = measure_zone_pitch(spec, x, sr, ls, le, round(pitch * 2) / 2 if spec.pitch_method == 'hsum' else pitch,
                                    0.6, linfo)
            if pl is not None and abs(pl - pitch) < 0.6:
                info['pitch_attack'] = round(pitch, 3)
                pitch = pl
                if 'pitch_spread' in linfo:
                    info['pitch_spread'] = linfo['pitch_spread']
        loop = (ls, le)
        n_keep = le
    elif mode == 'decay':
        end = min(x.shape[1], pre + int(t_store * sr))
        env = envelope(x, sr, 0.02)
        L = int(loop_len * sr)
        if per:
            L = int(round(max(1, round(L / per)) * per))
        # a note that has died into the noise floor before the loop would loop noise (and
        # whatever click is in it): end it there instead, without a loop
        pk = float(np.max(env[pre:pre + int(0.3 * sr)])) if x.shape[1] > pre + 16 else 1.0
        tail = env[min(x.shape[1] - 1, pre + int(0.1 * sr)):]
        floor = float(np.percentile(tail, 5)) if len(tail) > 16 else 0.0
        dead_thr = max(pk * 10 ** (-48 / 20), floor * 10 ** (12 / 20))
        alive = np.nonzero(env[:end] > dead_thr)[0]
        last_alive = int(alive[-1]) if len(alive) else end
        if last_alive < end - int(0.02 * sr):
            end = max(pre + int(0.12 * sr), last_alive)
            info['died_ms'] = round((end - pre) * 1000 / sr)
            ls_target = -1  # no loop
        else:
            ls_target = end - L
        if ls_target > pre + int(0.12 * sr) and end <= x.shape[1]:
            span = max(0.1 * L, 1.2 * per) if per else 0.1 * L  # at least a period either way
            ls, le, corr = find_loop(x, sr, ls_target - int(0.03 * sr), ls_target, int(L - span), int(L + span))
            # beating string courses / partials: pull the envelope onto its decay line (natural
            # signal, eased in before the loop) so the repeated loop does not flutter; the decay
            # rate comes from the same fit
            a0 = max(pre + int(0.05 * sr), ls - int(0.08 * sr))
            x, slope, resid = flatten_loop_envelope(x, sr, a0, ls, le, per)
            info['loop_am_db'] = round(resid, 1)
            decay = float(min(-spec.min_decay, slope))
            # flatten the loop region so the runtime decay continues the natural one
            k = math.log(10) / 20 * (-decay)
            idx = np.arange(ls, le)
            x = x.copy()
            x[:, ls:le] *= np.exp(k * (idx - ls) / sr)
            xf = int(min(0.03 * sr, (le - ls) / 3))
            x = crossfade_loop(x, ls, le, xf)
            loop = (ls, le)
            n_keep = le
            info['loop_corr'] = round(corr, 4)
        else:
            n_keep = end
    else:  # oneshot
        n_keep = min(x.shape[1], pre + int(t_store * sr))
    x = x[:, :n_keep]
    if not loop:
        x = fade(x, 0, min(int(spec.fade_out * sr), x.shape[1] // 4))
    if fin > 0:
        x = fade(x, min(fin, x.shape[1] // 2), 0)
    info['fade_in_ms'] = round(fin * 1000 / sr, 1)
    # loudness → gain
    if spec.loud_max:
        lu = max_short_loudness(x, sr, pre, x.shape[1])
    elif loop and mode == 'sustain':
        # what a typical note plays: the early sustain and the loop (not the first 100 ms)
        lu = loudness(x, sr, min(loop[0], pre + int(0.1 * sr)), loop[1])
    else:
        lu = loudness(x, sr, pre + int(spec.loud_win[0] * sr), pre + int(spec.loud_win[1] * sr))
    # every transient / perceptual zone keeps pre_ms of pre-roll before its attack, padded with
    # silence when the recording starts right at the attack: the MP3 pre-echo of the transient then
    # lands in that silence (the runtime fades the pre-roll in) instead of being cut into a step
    want = int(round(spec.pre_ms * sr / 1000))
    if amode != 'sustain' and pre < want:
        pad = want - pre
        x = np.pad(x, ((0, 0), (pad, 0)))
        pre += pad
        if loop:
            loop = (loop[0] + pad, loop[1] + pad)
        info['padded'] = pad
    pk = float(np.max(np.abs(x))) + 1e-12
    norm = PEAK / pk
    x = x * norm
    lu_n = lu + db(norm)
    gain = 10 ** ((TARGET_LU - lu_n) / 20)
    if loop:
        info['seam'] = round(seam_click(x, loop[0], loop[1]), 2)
    return Zone(c, x, pitch, pre, loop, decay, gain, lu_n, info)


def key_ranges(zones: list[Zone], ext_down: int = 5, ext_up: int = 5) -> dict[int, tuple[int, int]]:
    """Per zone key range: split at midpoints between neighbouring roots of the same (layer, rr)
    group; the outermost zones extend by ext_down / ext_up semitones."""
    res = {}
    groups: dict[tuple[int, int], list[int]] = {}
    for i, z in enumerate(zones):
        groups.setdefault((z.cand.layer, z.cand.rr), []).append(i)
    for idxs in groups.values():
        idxs.sort(key=lambda i: zones[i].pitch)
        roots = [round(zones[i].pitch) for i in idxs]
        for k, i in enumerate(idxs):
            lo = roots[0] - ext_down if k == 0 else (roots[k - 1] + roots[k]) // 2 + 1
            hi = roots[-1] + ext_up if k == len(idxs) - 1 else (roots[k] + roots[k + 1]) // 2
            res[i] = (lo, max(lo, hi))
    return res


def build_set(spec: SetSpec, src: Sources, report: list[str]) -> dict:
    cands = spec.cands(src)
    src.fetch(spec.repo, sorted({c.path for c in cands} | {p for c in cands for p, _ in c.mix}))
    # octave sanity: SFZ / file-name octave conventions differ, so measure a few zones and apply
    # one global octave correction for the set (unless the spec states it)
    zones: list[Zone] = []
    octave = spec.octave if spec.octave is not None else 0.0
    if spec.octave is None and any(c.pitched for c in cands):
        pitched = [c for c in cands if c.pitched]
        probe = pitched[:: max(1, len(pitched) // 7)][:7]
        votes = []
        for c in probe:
            path = src.fetch(spec.repo, [c.path])[0]
            x, sr0 = load_audio(path, mono=True)
            if c.offset:
                x = x[:, c.offset:]
            on = onset_index(x, sr0, slow=spec.slow_onset)
            a = on + int((0.15 if (c.mode or spec.mode) != 'sustain' else spec.loop_min) * sr0)
            pm = measure_pitch(x, sr0, a, min(x.shape[1], a + int(0.5 * sr0)), None, fmin=25, fmax=5000)
            if pm is None:
                continue
            d = pm - c.nominal
            v = round(d / 12) * 12
            if abs(d - v) < 1.0:
                votes.append(v)
        if votes:
            octave = float(max(set(votes), key=votes.count))
        print(f'  octave votes {votes} -> {octave:+.0f}', flush=True)
    for c in cands:
        zones.append(process_zone(spec, src, c, octave))
    ranges = key_ranges(zones, spec.ext_down, spec.ext_up)
    # sprite
    sr = spec.sr
    total = DATA0 + sum(z.audio.shape[1] + GAP for z in zones) + 4096
    sprite = np.zeros((spec.channels, total))
    sprite[:, MARKER] = MARKER_AMP
    pos = DATA0
    zdefs = []
    for i, z in enumerate(zones):
        n = z.audio.shape[1]
        sprite[:, pos:pos + n] = z.audio
        if z.loop:
            # guard: the loop's own continuation, faded out (see GUARD)
            ls, le = z.loop
            g = min(GUARD, le - ls, GAP - 256)
            sprite[:, pos + n:pos + n + g] = z.audio[:, ls:ls + g] * (0.5 + 0.5 * np.cos(np.linspace(0, math.pi, g)))
        lo, hi = ranges[i]
        zd = {'p': round(z.pitch, 4), 'lo': lo, 'hi': hi, 'l': z.cand.layer, 'r': z.cand.rr, 'o': pos, 'n': n,
              'pre': z.pre, 'g': round(z.gain, 5)}
        if z.loop:
            zd['ls'] = z.loop[0]
            zd['le'] = z.loop[1]
        if z.decay:
            zd['dec'] = round(z.decay, 3)
        zdefs.append(zd)
        pos += n + GAP
    os.makedirs(os.path.join(OUT_DIR, spec.name), exist_ok=True)
    mp3 = os.path.join(OUT_DIR, spec.name, f'{spec.name}.mp3')
    size = encode_mp3(sprite, sr, mp3, quality=spec.quality)
    # verify: decode, find marker, compare zones
    dec, dsr = decode_mp3(mp3)
    mk = int(np.argmax(np.abs(to_mono(dec)[:MARKER_WINDOW])))
    shift = mk - MARKER
    snrs = []
    seams = []
    lp = signal.butter(6, 8000, fs=sr, output='sos')
    for zd, z in zip(zdefs, zones):
        a = signal.sosfiltfilt(lp, to_mono(z.audio))
        b = to_mono(dec)[zd['o'] + shift: zd['o'] + shift + zd['n']]
        if len(b) == len(a):
            b = signal.sosfiltfilt(lp, b)
            err = a - b
            snrs.append(db(rms(a)) - db(rms(err) + 1e-12))
        if z.loop:
            d = dec[:, zd['o'] + shift:zd['o'] + shift + zd['n']]
            seams.append(seam_click(d, z.loop[0], z.loop[1]))
    secs = sum(z.audio.shape[1] for z in zones) / sr
    report.append(f'## {spec.name}  ({len(zones)} zones, {secs:.1f} s audio, {size / 1024:.0f} KB, '
                  f'octave corr {octave:+.0f}, marker shift {shift}, SNR min {min(snrs):.1f} dB, '
                  f'seam max {max(seams) if seams else 0:.2f})')
    for zd, z in zip(zdefs, zones):
        inf = z.info
        report.append(f"  {z.cand.label[:34]:34s} L{z.cand.layer} R{z.cand.rr} p={z.pitch:7.3f} ({note_name(round(z.pitch)):4s} "
                      f"{(z.pitch - round(z.pitch)) * 100:+5.1f}c nom {inf['nominal']:6.2f}) keys {zd['lo']}-{zd['hi']} "
                      f"n={zd['n'] / sr:.2f}s pre={zd['pre']} loop={inf.get('loop', '-') if z.loop else '-'} "
                      f"{('ls=%.2f le=%.2f' % (z.loop[0] / sr, z.loop[1] / sr)) if z.loop else ''} "
                      f"corr={inf.get('loop_corr', '')} seam={inf.get('seam', '')} dec={z.decay:.1f} "
                      f"lu={z.lu:.1f} g={20 * math.log10(z.gain):+.1f}dB "
                      f"att={inf.get('attack', '-')[:4]} pre={inf.get('pre_ms', 0)}ms fade={inf.get('fade_in_ms', 0)}ms"
                      + (f" skip={inf['skipped_ms']}ms" if inf.get('skipped_ms') else '')
                      + (f" cut={inf['attack_cut_ms']}ms(att {inf.get('attack_ms')})" if 'attack_cut_ms' in inf else '')
                      + (f" died={inf['died_ms']}ms" if 'died_ms' in inf else '')
                      + (f" loopAM={inf['loop_am_db']}dB" if 'loop_am_db' in inf else '')
                      + (f" h1-fit={inf['h1_vs_fit_cents']}c" if 'h1_vs_fit_cents' in inf else '')
                      + (f" rise={inf['rise_ms']}ms" if inf.get('rise_ms') else '')
                      + (f" spread={inf['pitch_spread']}c" if inf.get('pitch_spread') is not None else '')
                      + (f" PITCH-FALLBACK({inf['pitch_fallback']})" if 'pitch_fallback' in inf else '')
                      + (f" relabeled{inf['relabeled']:+.2f}" if 'relabeled' in inf else '')
                      + (' narrow' if inf.get('narrow') is not None and 'pitch_fallback' not in inf else ''))
    sources = sorted({z.cand.path for z in zones} | {mp for z in zones for mp, _ in z.cand.mix})
    return {'name': spec.name, 'repo': spec.repo, 'sources': sources, 'note': spec.note,
            'file': f'{spec.name}/{spec.name}.mp3', 'sr': sr, 'ch': spec.channels,
            'marker': MARKER, 'win': MARKER_WINDOW, 'bytes': size, 'seconds': round(secs, 2), 'zones': zdefs}


def write_manifest(sets: list[dict]) -> None:
    lines = [
        '/**',
        ' * GENERATED by scripts/audio/build_instruments.py — do not edit by hand.',
        ' *',
        ' * Sample sets for the sampled instruments (see src/audio/sampled.ts). Each set is one MP3 sprite',
        ' * (src/audio/assets/inst/<set>/<set>.mp3) that starts with an alignment impulse at `marker`',
        ' * (search it in [0, win) of the decoded PCM; the offset found shifts every zone).',
        ' * Zone fields (sample positions in the sprite at `sr`):',
        ' *   p   measured sounding pitch (fractional MIDI)   lo/hi  key range (MIDI, inclusive)',
        ' *   l   velocity layer (0 = softest)                r      round robin / articulation',
        ' *   o   offset of the zone in the sprite            n      length',
        ' *   pre onset position inside the zone              g      gain to the common loudness',
        ' *   ls/le loop start/end inside the zone            dec    decay after ls (dB/s, decaying loops)',
        ' */',
        "import type { SampleSetDef } from '../../sampled';",
        '',
        'export const SAMPLE_SETS: SampleSetDef[] = [',
    ]
    for s in sets:
        zs = ',\n'.join('      ' + json.dumps(z, separators=(',', ':')).replace('"', '') for z in s['zones'])
        lines.append(f"  {{\n    name: '{s['name']}',\n    file: '{s['file']}',\n    sr: {s['sr']},\n    ch: {s['ch']},\n"
                     f"    marker: {s['marker']},\n    win: {s['win']},\n    zones: [\n{zs},\n    ],\n  }},")
    lines.append('];')
    lines.append('')
    with open(os.path.join(OUT_DIR, 'manifest.ts'), 'w') as f:
        f.write('\n'.join(lines))


SPECIAL_LICENSES = [
    # (repo, path substring, license, attribution)
    ('sso', 'Samples/Horns/horns-sus', 'CC BY-SA 3.0',
     'French horn section sustain samples by Mattias Westlund (www.mattiaswestlund.net), from Sonatina Symphonic Orchestra'),
    ('sso', 'Samples/Celeste/', 'CC0 1.0',
     'Celesta samples by stamperadam (freesound.org pack 6166), as included in Sonatina Symphonic Orchestra'),
    ('sso', 'Samples/Organ/', 'CC Sampling Plus 1.0',
     'Pipe organ samples: "St. Stephen\'s Anglican" (the St. Stephen\'s pipe organ) recorded by Nicholas Appleton, '
     'as included (converted to FLAC, sampled in minor thirds, denoised) in Sonatina Symphonic Orchestra'),
]

SOURCE_NOTES = {
    'accordion': 'https://github.com/freepats/button-accordion-hn — Hohner button accordion recorded by Jeff Stauffer (2023), '
                 'sent to FreePats via Piotr Barz; bank by michael02022. freepats.zenvoid.org',
    'mandolin': 'https://github.com/sfzinstruments/terkelsen.mandolin — "Terkelsen\'s Mandolin" contributed by Lars Terkelsen, '
                'converted from GigaSampler to SFZ by S. Christian Collins (www.schristiancollins.com). The repository states no '
                'license; it is used with credit, as the Audio 2.0 brief allows for this prototype — replace before release '
                'if the license cannot be confirmed.',
    'meta': 'https://github.com/facebookincubator/Meta-open-sound — Meta Piano, Meta Nylon Guitar, Meta Steel Guitar '
            '(Meta Creative Audio team), CC0 1.0. Source files are the repository\'s OGG previews.',
    'sso': 'https://github.com/peastman/sso — Sonatina Symphonic Orchestra by Mattias Westlund (2011), developed further '
           'by Peter Eastman and contributors. CC Sampling Plus 1.0 (https://creativecommons.org/licenses/sampling+/1.0/). '
           'SSO itself was built from the University of Iowa MIS, MSLP, Philharmonia, OLPC, K2000, freesound.org and other '
           'free sources listed in its README.',
    'vcsl': 'https://github.com/sgossner/VCSL — Versilian Community Sample Library by Versilian Studios LLC (Sam Gossner), CC0 1.0.',
    'worldperc': 'https://github.com/freepats/world-percussion — FreePats World Percussion (recordings by Xavimart, '
                 'Gonzalo and Roberto, 2019), CC0 1.0.',
    'gleitz': 'https://github.com/gleitz/midi-js-soundfonts — pre-rendered "Musyng Kite" General MIDI soundfont, '
              'CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/).',
}


REPO_URL = {
    'accordion': 'https://github.com/freepats/button-accordion-hn',
    'mandolin': 'https://github.com/sfzinstruments/terkelsen.mandolin',
    'meta': 'https://github.com/facebookincubator/Meta-open-sound',
    'sso': 'https://github.com/peastman/sso',
    'vcsl': 'https://github.com/sgossner/VCSL',
    'worldperc': 'https://github.com/freepats/world-percussion',
    'gleitz': 'https://github.com/gleitz/midi-js-soundfonts',
}


def set_users() -> dict[str, list[str]]:
    """set name -> instrument ids, read from SAMPLED_SPECS in src/audio/sampled.ts"""
    out: dict[str, list[str]] = {}
    try:
        with open(os.path.join(ROOT, 'src', 'audio', 'sampled.ts')) as f:
            for m in re.finditer(r"S\('([A-Za-z]+)', '([a-z]+)'", f.read()):
                out.setdefault(m.group(2), []).append(m.group(1))
    except OSError:
        pass
    return out


def write_credits(sets: list[dict]) -> None:
    users = set_users()
    total = sum(s['bytes'] for s in sets)
    L = ['# Music instrument samples — sources, licenses, credits', '',
         'Generated by `scripts/audio/build_instruments.py` (do not edit by hand). The recorded instruments in',
         '`src/audio/assets/inst/` are excerpts of the sample libraries below: trimmed, DC-filtered, resampled (32 kHz;',
         '24 kHz for the bass instruments, 44.1 kHz for some percussion), mono unless noted, looped/crossfaded,',
         'loudness-normalised and MP3-encoded (libmp3lame VBR) — modified versions of the originals.',
         f'Total: {len(sets)} MP3 sprites, {total:,} bytes = {total / 1e6:.3f} MB (SI; {total / 1048576:.2f} MiB).', '',
         '## Attribution lines (for the game credits)', '',
         '- Accordion: "Button Accordion HN" — FreePats project (Hohner accordion recorded by Jeff Stauffer; bank by michael02022), CC0 1.0.',
         '- Mandolin: "Terkelsen\'s Mandolin" by Lars Terkelsen, SFZ conversion by S. Christian Collins (license not stated; credited).',
         '- Piano, nylon guitar, steel guitar: "Meta Open Sound" by Meta (Creative Audio team), CC0 1.0.',
         '- Orchestra (strings, brass, woodwinds, chorus, organ, harp, mallets, timpani, tam-tam): "Sonatina Symphonic Orchestra"',
         '  by Mattias Westlund and Peter Eastman, CC Sampling Plus 1.0; horn section sustains by Mattias Westlund, CC BY-SA 3.0;',
         '  celesta by stamperadam (freesound.org), CC0 1.0; pipe organ: "St. Stephen\'s Anglican" recorded by Nicholas Appleton,',
         '  CC Sampling Plus 1.0.',
         '- Harpsichord, percussion (tambourine, snare, cymbals, bass drums, triangle, shaker, brake drum, anvil, slapstick,',
         '  woodblock, vibraslap, flexatone, claves, ratchet, toy whistle): "Versilian Community Sample Library" by Versilian',
         '  Studios, CC0 1.0.',
         '- Castanets: "World Percussion" — FreePats project, CC0 1.0.',
         '- Orchestra hit: "Musyng Kite" soundfont via midi-js-soundfonts (Benjamin Gleitzman), CC BY-SA 3.0.',
         '', '## Sources', '']
    for repo in sorted({s['repo'] for s in sets}):
        lic = REPOS[repo][1]
        L.append(f'- **{repo}** ({lic}): {SOURCE_NOTES.get(repo, REPOS[repo][2])}')
    # arranger reference: playable range per instrument id
    L += ['', '## Instrument reference (for arrangers)', '',
          'Sounding pitch, MIDI (C4 = 60). "zones" = the recorded range; notes up to the "playable" edges are pitch-shifted',
          'from the nearest recording; notes beyond fold by whole octaves into the playable range. Velocity selects the',
          'layer (thresholds in `src/audio/sampled.ts`) and scales the gain; variants are round robins or articulations.', '',
          '| ids | set | zones (recorded) | playable | layers | round robins |', '|---|---|---|---|---|---|']
    for st in sets:
        zs = st['zones']
        roots = sorted(z['p'] for z in zs)
        lo = min(z['lo'] for z in zs)
        hi = max(z['hi'] for z in zs)
        layers = len({z['l'] for z in zs})
        rrs = len({z['r'] for z in zs})
        ids = ', '.join(f'`{i}`' for i in users.get(st['name'], [])) or '—'
        pitched = len({round(r) for r in roots}) > 1
        rng = f"{note_name(round(roots[0]))}–{note_name(round(roots[-1]))} ({round(roots[0])}–{round(roots[-1])})" if pitched else 'unpitched'
        play = f"{note_name(lo)}–{note_name(hi)} ({lo}–{hi})" if pitched else '—'
        L.append(f"| {ids} | `{st['name']}` | {rng} | {play} | {layers} | {rrs} |")
    L += ['', 'Notes for arrangers:', '',
          '- Range: notes beyond the playable edges fold by octaves; notes further than a fourth (+ half a semitone) from',
          '  their nearest recording, and folded notes, are listed in the song render warnings (`range: ...`).',
          '- Short notes: `violin`, `strings`, `cello`, `contrabass`, `choir`, `choirO` (gate <= 0.3 s) and `flute`',
          '  (<= 0.2 s) play a short articulation — the recording entered in its sustain (at the loop start) with a',
          '  10-25 ms fade-in — so they speak at once; longer notes keep the recorded (slower) attack.',
          '- Timing: every recording is aligned on its perceptual onset (the attack is on the beat; pick / bow noise and',
          '  slow attack build-ups sound just before it).',
          '- `accordion`, `accordionDry` and `accChord` play the same recording: a musette (two reeds about +5 and +28',
          '  cents, beating about 7 Hz at C5). `accordionDry` / `accChord` only change the tone (low-pass, high-pass) and',
          '  the stereo width — the source has no single-reed register, so they beat like the lead.',
          '- Stereo: mono recordings of ensembles and cymbals (`strings`, `strStab`, `choir`, `choirO`, the accordions,',
          '  `brass`, `brassSoft`, `organ`, `crash`, `tamtam`) play a second take or the neighbouring recording on the',
          '  right channel; `cymbal` is a stereo recording.',
          '- Variants keep the synth meaning: `timpani` variant 1 is the soft stroke (-4.5 dB); `tamb` accents (4, 5)',
          '  are +2 dB, shakes (2, 3) -3.5 dB; `cymbal` / `bassDrum` variant 1 is the roll at any velocity.',
          '- `steelGuitar` has one velocity layer (Meta Vel02; the 5 MB budget leaves no room for Vel01 / Vel03).',
          '', 'Share-alike: the files derived from CC BY-SA 3.0 sources (`horns`, `orchhit`) are themselves CC BY-SA 3.0;',
          'the files derived from Sonatina Symphonic Orchestra are under CC Sampling Plus 1.0.', '',
          '## Sample sets (file → instruments → exact source files)', '']
    for s in sets:
        repo = s['repo']
        lic = REPOS[repo][1]
        special = [(lc, at) for (r, sub, lc, at) in SPECIAL_LICENSES if r == repo and any(sub in p for p in s['sources'])]
        if special:
            lic = ' / '.join(sorted({lc for lc, _ in special}))
        ids = ', '.join(f'`{i}`' for i in users.get(s['name'], [])) or '—'
        L.append(f"### `{s['file']}` — {len(s['zones'])} zones, {s['seconds']:.1f} s, {s['bytes'] / 1024:.0f} KB")
        L.append(f'- instruments: {ids}')
        L.append(f'- source: {REPO_URL.get(repo, repo)}, license: {lic}')
        for lc, at in special:
            L.append(f'  - {at} ({lc})')
        if s.get('note'):
            L.append(f"- {s['note']}")
        L.append('- files: ' + '; '.join(f'`{p}`' for p in s['sources']))
        L.append('')
    os.makedirs(os.path.join(ROOT, 'docs', 'credits'), exist_ok=True)
    with open(os.path.join(ROOT, 'docs', 'credits', 'music-samples.md'), 'w') as f:
        f.write('\n'.join(L))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--cache', default=os.path.join(tempfile.gettempdir(), 'kf-instrument-cache'))
    ap.add_argument('--only', default='', help='comma separated set names (others are kept from the previous build)')
    ap.add_argument('--report', default='', help='write the per-zone report here')
    ap.add_argument('--docs-only', action='store_true', help='rewrite manifest.ts + credits from the last build state')
    args = ap.parse_args()
    src = Sources(args.cache)
    only = {s for s in args.only.split(',') if s}
    os.makedirs(OUT_DIR, exist_ok=True)
    state_path = os.path.join(args.cache, 'build-state.json')
    prev = {}
    if os.path.exists(state_path):
        with open(state_path) as f:
            prev = {s['name']: s for s in json.load(f)}
    report: list[str] = []
    out = []
    failed = []
    if args.docs_only:
        out = [prev[sp.name] for sp in SETS if sp.name in prev]
        SETS_TO_BUILD: list[SetSpec] = []
    else:
        SETS_TO_BUILD = SETS
    for spec in SETS_TO_BUILD:
        if only and spec.name not in only and spec.name in prev:
            out.append(prev[spec.name])
            continue
        print(f'building {spec.name} ...', flush=True)
        try:
            out.append(build_set(spec, src, report))
        except Exception as e:  # keep going; report the failure (previous build of the set is kept)
            import traceback
            traceback.print_exc()
            failed.append(spec.name)
            if spec.name in prev:
                out.append(prev[spec.name])
            continue
        print('\n'.join(r for r in report if r.startswith('## ' + spec.name)), flush=True)
        with open(state_path, 'w') as f:  # incremental: a later failure keeps finished sets
            json.dump(out + [prev[s.name] for s in SETS if s.name in prev and s.name not in {o['name'] for o in out}], f)
    with open(state_path, 'w') as f:
        json.dump(out, f)
    if failed:
        print('FAILED SETS:', ', '.join(failed))
    # source lists for the credits (older build states may lack them: recompute from the specs)
    by_name = {sp.name: sp for sp in SETS}
    for o in out:
        if 'sources' not in o and o['name'] in by_name:
            sp = by_name[o['name']]
            cs = sp.cands(src)
            o['sources'] = sorted({c.path for c in cs} | {mp for c in cs for mp, _ in c.mix})
            o['repo'] = sp.repo
            o['note'] = sp.note
    with open(state_path, 'w') as f:
        json.dump(out, f)
    write_manifest(out)
    write_credits(out)
    total = sum(s['bytes'] for s in out)
    secs = sum(s['seconds'] for s in out)
    report.append(f'\nTOTAL {len(out)} sets, {sum(len(s["zones"]) for s in out)} zones, {secs:.1f} s, {total:,} bytes '
                  f'= {total / 1e6:.3f} MB SI ({total / 1048576:.2f} MiB; budget 5.000 MB SI'
                  f'{" EXCEEDED" if total > 5_000_000 else ""}); decoded float32 at set rates ≈ '
                  f'{sum(s["seconds"] * s["sr"] * s["ch"] * 4 for s in out) / 1048576:.1f} MB')
    print(report[-1])
    if args.report:
        with open(args.report, 'w') as f:
            f.write('\n'.join(report) + '\n')


if __name__ == '__main__':
    main()
