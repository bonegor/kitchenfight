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
                            decay_slope, env_range_db, even_crescendo, fade, find_loop, flatten_loop_envelope,
                            flatten_sustain_loop, ftom,
                            load_audio, loop_corr, loudness, onset_power, perceptual_onset,
                            max_short_loudness, measure_pitch, measure_pitch_centroid, measure_pitch_decay,
                            measure_pitch_hfit, measure_pitch_hsum, measure_pitch_track, mtof, note_name, onset_index,
                            onset10_index, resample, rms, seam_click, single_reed, to_mono, yin_f0)
from instrument_sources import REPOS, Region, Sources, parse_sfz  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT_DIR = os.path.join(ROOT, 'src', 'audio', 'assets', 'inst')

MARKER = 2048  # impulse position in every sprite (samples)
LOOP_RANGE_TOL = 2.5  # dB a sustained loop's level range may exceed the sustain's own range before it
BEAT_TOL = 0.0025  # s: a beat further than this from the perceptual onset (the attack test's) is moved there
DECAY_AM_LIM = 6.0  # dB: modulation (around the decay line) a decaying loop may hold before a flatter one is sought
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
# sustained sets (bowed / blown / sung, the accordion): the attack model's beat (-12 dB of the early
# sustain on the faded attack) anchors the zone's loop, pitch and loudness windows; the beat the
# manifest stores is then moved onto the perceptual onset of what plays (sustain_beat: the decoded
# zone, loop repeated; instrument_dsp.perceptual_onset: the suite's att10 = 0, or the attack of a note
# that dwells on a plateau below -10 dB). The build-up before it stays as pre-roll, at most SUS_MAX_PRE
# (at the recording's own pitch; instruments.ts MAX_PRE_SEC covers it shifted down a fourth). A slower
# swell is entered later, with a SUS_FADE raised-cosine fade-in (ending at least SUS_FADE_GAP before the
# beat) — only where everything cut away is still quiet (at most SUS_CUT_DB re the note's maximum) and holds
# no attack out of silence (a climb of SUS_CUT_RISE dB within SUS_CUT_RISE_WIN to above SUS_CUT_ATTACK_DB: a
# breath or bow attack, which a fade-in from the middle of what follows it would replace): the rest of the
# build-up keeps its recorded shape. A louder build-up keeps the recording's start and its beat — a longer
# pre-roll, as long as every key of the zone can carry it (RT_MAX_PRE, played down to the zone's lowest key)
# — or, longer still, a beat that early (never cut into an attack).
SUS_MAX_PRE = 0.08
SUS_FADE = 0.02
SUS_FADE_GAP = 0.005
SUS_CUT_DB = -20.0
SUS_CUT_RISE = 10.0
SUS_CUT_RISE_WIN = 0.015
SUS_CUT_ATTACK_DB = -25.0
RT_MAX_PRE = 0.118  # s: the longest pre-roll a Sample may carry (instruments.ts MAX_PRE_SEC 0.12, a margin)


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
    repo: str | None = None  # source repository of this zone (None = the set's): sets mixing two libraries
    fade_in: float | None = None  # per-zone override of SetSpec.fade_in (s; a roll entered mid-crescendo)
    level_db: float = 0.0  # zone loudness re the set's (TARGET_LU): an articulation level-matched to the one it replaced
    swell_db: float | None = None  # a sustained crescendo (roll): grown evenly from this re its peak (even_crescendo)


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
    # 'transient': recordings that start right on the hit (castanets, drums trimmed at the stroke): the
    # fade-in covers only the pre-roll before the attack's rise, a zone without pre_ms of it gets this
    # anti-click ramp (s) and pre_ms of silence before the rise (attack_points hit_ramp). None = the
    # min_fade anti-click fade (up to 3 ms from the zone start), which the other sets were built with
    hit_ramp: float | None = None
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
    # tubular-bell strike tone: modes 4:5:6 ~ 2:3:4 of it, an octave below the 4th mode | 'decay' =
    # decaying section tones (pizzicato): pooled frame-wise harmonic medians + YIN over the decay
    pitch_method: str = 'centroid'
    pitch_hmin: int = 1
    pitch_hmax: int = 6
    pitch_win: tuple[float, float] = (0.05, 0.4)
    octave: float | None = None  # known octave correction (None = vote by measuring)
    max_disagree: float = 0.0  # > 0: drop takes whose independent pitch readings disagree by more (cents)
    single_reed: bool = False  # sustain + loops of whole beat cycles: keep the lower reed of a musette
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


def accordion_dry_cands(src: Sources) -> list[Cand]:
    # the dry accordion voicings play the accompaniment register: every other recording, B2..D5, and
    # the top one (G5: the same playable range as the lead)
    keep = {47, 50, 54, 57, 60, 64, 67, 71, 74, 79}
    return [c for c in accordion_cands(src) if round(c.nominal) in keep]


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

# The suspended-cymbal roll (set 'cymbal', variant 1): SSO's forte crescendo roll grows from -33 dB to
# its peak over 1.6 s (slowly, then by 25-30 dB/s), its spectral centroid from 0.4 to 4 kHz, holds the
# peak for 0.38 s and rings out. What the songs ask a roll for is a swell into the next downbeat over
# 0.3-1.8 s: a roll note enters the crescendo at CYM_ROLL_ENTRY (source samples, 44.1 kHz; 17 dB under
# the peak, where it starts to brighten), grown evenly from CYM_ROLL_SWELL dB (K-weighted, re the peak)
# into the peak (instrument_dsp.even_crescendo: about 10 dB/s, slower than the 0.6 s release decays,
# so a note of any length is at its loudest at its end), then looped on the peak. CYM_ROLL_LEVEL (dB re
# the set's loudness target): the held roll at the level of the VCSL roll it replaced (measured on what the
# sampler renders, before velocity and channel gains: -18.8 dB K-weighted over 2-2.5 s of a held note),
# which the songs' cymbal channels were balanced against.
CYM_ROLL_ENTRY = round(0.9 * 44100)
CYM_ROLL_SWELL = -9.0
CYM_ROLL_LEVEL = 0.84
# anti-click ramp of the hits recorded from their stroke (SetSpec.hit_ramp): castanets, kick, snare
HIT_RAMP = 0.0002

SETS: list[SetSpec] = [
    # --- plucked / keyboard -------------------------------------------------------------------
    SetSpec('accordion', 'accordion', accordion_cands, 'sustain', quality=4, pre_ms=3, octave=0, max_attack=0.07,
            use_sfz_loop=True, max_sfz_end=2.6, xfade=0.03, pitch_harmonics=1, ext_up=5,
            note='FreePats Hohner button accordion, SFZ loop points (musette beat cycles)'),
    SetSpec('accdry', 'accordion', accordion_dry_cands, 'sustain', sr=24000, quality=5, pre_ms=3, octave=0,
            max_attack=0.07, use_sfz_loop=True, max_sfz_end=2.6, xfade=0.03, pitch_harmonics=1, ext_down=5, ext_up=5,
            single_reed=True,
            note='the same FreePats accordion, one reed: after the recorded attack the musette is crossfaded into its '
                 'lower reed alone (the higher reed cleared from the loop spectrum: in a loop of whole beat cycles each '
                 'reed has its own partials); for the accordionDry / accChord voicings'),
    SetSpec('mandolin', 'mandolin', mandolin_cands, 'decay', quality=4, octave=0, t_store=0.7, loop_len=0.12,
            loud_win=(0.0, 0.25), min_decay=3, note="Terkelsen's mandolin, 2 velocity layers"),
    SetSpec('guitar', 'meta', meta_guitar_cands('nylon', ['Vel01Finger', 'Vel03Pick'], 3, 40, 83), 'decay',
            quality=4.5, octave=0, t_store=0.95, loop_len=0.16, loud_win=(0.0, 0.3), min_decay=4,
            note='Meta nylon guitar: fingerstyle + firm pick layers'),
    SetSpec('steelguitar', 'meta', meta_guitar_cands('steel', ['Vel02'], 3, 40, 84), 'decay',
            quality=5, octave=0, t_store=0.95, loop_len=0.16, loud_win=(0.0, 0.3), min_decay=4),
    SetSpec('piano', 'meta', meta_piano_cands, 'decay', partials=1, quality=4.5, octave=0, t_store=0.9, loop_len=0.2,
            loud_win=(0.0, 0.4), min_decay=2, pitch_harmonics=1, ext_down=3, ext_up=3, trust_below=40,
            note='Meta upright piano: mp + ff layers, a zone every major third; pitch = the fundamental (the '
                 'stretched upper partials would read a shifted note differently from its recording)'),
    SetSpec('harpsichord', 'vcsl', harpsichord_cands, 'decay', quality=5, t_store=0.8, loop_len=0.12,
            loud_win=(0.0, 0.3), min_decay=4, note='VCSL Italian harpsichord (stop 1)'),
    SetSpec('harp', 'sso', sso_cands('Harp', r'harp-([a-g]#?\d)\.wav'), 'decay', quality=5, t_store=1.0,
            loop_len=0.2, loud_win=(0.0, 0.3), min_decay=1.5),
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
            'oneshot', quality=5, t_store=0.42, fade_out=0.1, loud_win=(0.0, 0.15), pitch_win=(0.03, 0.3),
            attack='perceptual', pitch_method='decay',
            note='SSO 1st violins + celli staccato, 2 round robins; pitch = the pooled frame-wise reading over 30-300 ms '
                 '(a section staccato glides after the bow stroke)'),
    SetSpec('pizz', 'sso', join(sso_cands('1st Violins', r'1st-violins-piz-rr1-([a-g]#?\d)\.wav', rr=0),
                                sso_cands('1st Violins', r'1st-violins-piz-rr2-([a-g]#?\d)\.wav', rr=1),
                                sso_cands('Celli', r'celli-piz-rr1-([a-g]#?\d)\.wav', rr=0, hi=54),
                                sso_cands('Celli', r'celli-piz-rr2-([a-g]#?\d)\.wav', rr=1, hi=54)),
            'oneshot', quality=5, t_store=0.6, fade_out=0.15, loud_win=(0.0, 0.2), pitch_win=(0.03, 0.4),
            attack='perceptual', pitch_method='decay', max_disagree=20,
            note='SSO 1st violins + celli pizzicato, 2 round robins (rr2 files are a semitone off their names: measured); '
                 'pitch = the pooled frame-wise reading over 30-400 ms (the pitch settles after the pluck); takes whose '
                 'players disagree (independent readings > 20 cents apart) are left out'),
    SetSpec('ubass', 'sso', join(sso_cands('Bass', r'bass-piz-rr\d-([a-g]#?\d)\.flac')), 'decay', sr=24000, quality=5,
            t_store=0.85, loop_len=0.15, loud_win=(0.0, 0.3), min_decay=2, pitch_harmonics=1,
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
            octave=0, pitch_method='hsum', fade_in=0.15, max_pre=0.06, ext_up=5,
            note='SSO mixed chorus "aah", every other semitone, attack offset as in the SFZ (the zones start '
                 'mid-sound: the SFZ ampeg_attack is applied as a 0.15 s fade-in); pitch by harmonic sum '
                 '(the SFZ tune values are off by up to 45 cents on the male chorus)'),
    SetSpec('organ', 'sso', organ_cands, 'sustain', quality=5, pre_ms=3, octave=0, max_attack=0.12, loop_min=0.3, loop_max=0.7,
            loop_len=0.3, xfade=0.05, note="SSO pipe organ: open diapason 8' + principal 4' + fifteenth 2'"),
    # --- mallets / bells -----------------------------------------------------------------------
    SetSpec('glock', 'sso', sso_cands('Percussion', r'glockenspiel-([a-g]#?\d)\.wav'), 'decay', partials=1, quality=5,
            t_store=0.7, loop_len=0.08, loud_win=(0.0, 0.3), min_decay=1.5, pitch_harmonics=1),
    SetSpec('xylophone', 'sso', sso_cands('Percussion', r'xylophone-([a-g]#?\d)\.wav'), 'oneshot', partials=1, quality=5,
            t_store=0.45, fade_out=0.1, loud_win=(0.0, 0.15), pitch_harmonics=1),
    SetSpec('vibes', 'sso', sso_cands('Vibraphone', r'vibraphone-([a-g]#?\d)\.flac'), 'decay', partials=1, quality=5,
            t_store=1.1, loop_len=0.2, loud_win=(0.0, 0.4), min_decay=2, pitch_harmonics=1),
    SetSpec('celesta', 'sso', join(sso_cands('Celeste', r'celeste-([a-g]#?\d)-hard\.flac', layer=1),
                                   sso_cands('Celeste', r'celeste-([a-g]#?\d)-soft\.flac', layer=0, every=2)),
            'decay', partials=1, quality=5, t_store=0.7, loop_len=0.1, loud_win=(0.0, 0.3), min_decay=3, pitch_harmonics=1),
    SetSpec('chimes', 'sso', sso_cands('Percussion', r'chimes-([a-g]#?\d)\.wav', every=2), 'decay', partials=1, quality=5.5,
            t_store=1.8, loop_len=0.3, loud_win=(0.0, 0.5), min_decay=2, pitch_harmonics=1, octave=12,
            pitch_method='strike', ext_down=5,
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
            'oneshot', sr=44100, quality=5, t_store=0.5, fade_out=0.12, loud_win=(0.0, 0.1), octave=0, hit_ramp=HIT_RAMP,
            note='VCSL rope-tension snare (high), 4 dynamics x 2 round robins; the recordings start on the stroke: '
                 'its rise is kept whole behind a 0.2 ms ramp and 1.5 ms of silence'),
    SetSpec('crash', 'vcsl', fixed([
        vc(f'{VCSL_I}/Clash Cymbals 1/cymbal_crash1_mf1.wav', 0, 0), vc(f'{VCSL_I}/Clash Cymbals 1/cymbal_crash1_mf2.wav', 0, 1),
        vc(f'{VCSL_I}/Clash Cymbals 1/cymbal_crash1_ff2.wav', 1, 0), vc(f'{VCSL_I}/Clash Cymbals 1/cymbal_crash1_ff3.wav', 1, 1)]),
            'decay', sr=44100, quality=5, t_store=1.4, loop_len=0.35, loud_win=(0.0, 0.5), min_decay=4, octave=0,
            loud_max=True, note='VCSL clash cymbals (piatti); stereo at runtime: the two takes of a dynamic play left / right'),
    SetSpec('kick', 'vcsl', fixed([
        vc(f'{VCSL_M}/Bass Drum 1/BDrumNew_hit_v{v}_rr{r}_Sum.wav', layer=li, rr=r - 1)
        for li, v in enumerate((3, 5, 7)) for r in (1, 2)]),
            'oneshot', sr=24000, quality=5.5, t_store=0.8, fade_out=0.2, loud_win=(0.0, 0.2), octave=0, hit_ramp=HIT_RAMP,
            note='VCSL orchestral bass drum, 3 dynamics x 2 round robins; the beater\'s stroke is kept whole (the '
                 'recordings start on it or 1.5 ms before it: a 0.2 ms ramp, or a fade over that 1.5 ms only)'),
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
            'oneshot', quality=5.5, t_store=0.22, fade_out=0.05, loud_win=(0.0, 0.08), octave=0, hit_ramp=HIT_RAMP,
            note='FreePats castanets, 4 takes; the recordings start on the click: kept whole behind a 0.2 ms ramp and '
                 '1.5 ms of silence'),
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
        Cand(path=f'{SSOS}/Percussion/cymbal_roll-a-f.wav', repo='sso', nominal=60, layer=0, rr=1, pitched=False,
             mode='sustain', offset=CYM_ROLL_ENTRY, loop_len=0.25, onset_db=-20, fade_in=0.03, swell_db=CYM_ROLL_SWELL,
             level_db=CYM_ROLL_LEVEL, label='cymbal_roll-a-f.wav')]),
            'decay', sr=44100, channels=2, quality=5, t_store=1.5, loop_len=0.35, loud_win=(0.0, 0.5), min_decay=3, octave=0,
            loud_max=True, loop_min=0.84, loop_max=0.88, xfade=0.06,
            note='VCSL suspended cymbal hits (variant 0, 2 dynamics) + the SSO crescendo roll (variant 1, one take; '
                 'VCSL\'s roll is dark: 4-8 kHz at -38 dB): entered 0.9 s into the recorded crescendo (17 dB under its '
                 'peak, where it starts to brighten) and evened out to grow from 9 dB under the peak into it over 0.76 s '
                 '(slower than the release decays: a roll note of any length is at its loudest at its end), then looped '
                 'on the peak (the 0.38 s the player holds it before the cymbal rings out); the held roll plays at the '
                 'level of the VCSL roll it replaces (the songs were balanced against it). Stereo recordings (one take '
                 'per articulation)'),
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
    if spec.pitch_method == 'decay':
        # decaying section tones (pizzicato: several players, a pitch glide after the pluck): the
        # harmonic-comb track over the first 150 ms finds the note (file names can be a semitone
        # off), the pooled frame-wise estimate over the whole window (the early decay, where the
        # pitch settles after the pluck) measures it
        sp = min(span, 1.0)
        meth = lambda y, r, a, b, e: measure_pitch_hsum(y, r, a, b, e, span=sp, harmonics=8)  # noqa: E731
        coarse, _ = measure_pitch_track(x, sr, w0, min(w1, w0 + int(0.15 * sr)), nominal, meth, frame=0.1)
        pm, dinf = measure_pitch_decay(x, sr, w0, w1, coarse if coarse is not None else nominal, span_cents=80)
        if dinf.get('spread') is not None:
            info['pitch_spread'] = dinf['spread']
        return pm if pm is not None else coarse
    if spec.pitch_method == 'hsum' or spec.partials > 1:
        # harmonic tones (strings, winds, brass, voices, plucked strings): per frame the harmonic
        # comb that fits the spectrum best (no peak-prominence test: vibrato smears the partials of
        # a short frame, and a frame that cannot be measured must not drop out of the mean)
        # (a set with partials=1 — piano, mallets — takes the fundamental alone, below)
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
    repo = c.repo or spec.repo
    path = src.fetch(repo, [c.path])[0]
    x, sr0 = load_audio(path, mono=spec.channels == 1)
    if spec.channels == 2 and x.shape[0] == 1:
        x = np.vstack([x, x])
    x = dc_block(x, sr0)  # DC / sub-audio offset (some SSO brass files carry -20 dB of DC)
    if c.gain_db:
        x = x * 10 ** (c.gain_db / 20)
    for mp, mg in c.mix:  # layered premix (e.g. marcato = sustain + staccato accent)
        y, _ = load_audio(src.fetch(repo, [mp])[0], sr=sr0, mono=spec.channels == 1)
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
                                       max_attack=spec.max_attack,
                                       fade_in=c.fade_in if c.fade_in is not None else spec.fade_in, period=per0,
                                       hit_ramp=spec.hit_ramp)
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
        if spec.max_disagree and 'pitch_fallback' not in info:
            # a take whose players disagree has no pitch to tune it to: two independent readings of
            # the same window (median YIN of 50 ms frames, a harmonic comb over the whole window)
            # must agree with the measured pitch, else the take is dropped (its neighbours cover it)
            m = to_mono(x)
            ys = []
            for a in range(w0, w1 - int(0.05 * sr) + 1, int(0.01 * sr)):
                f = yin_f0(m[a:a + int(0.05 * sr)], sr, mtof(pitch - 2), mtof(pitch + 2))
                if f:
                    ys.append(ftom(f))
            comb = measure_pitch_hsum(x, sr, w0, min(x.shape[1], w0 + int(0.42 * sr)), pitch, span=1.0, harmonics=8)
            dy = (float(np.median(ys)) - pitch) * 100 if ys else 0.0
            dc = (comb - pitch) * 100 if comb is not None else 0.0
            info['pitch_check'] = (round(dy, 1), round(dc, 1))
            if max(abs(dy), abs(dc)) > spec.max_disagree:
                info['drop'] = f'players disagree: YIN {dy:+.0f} c, comb {dc:+.0f} c re {pitch:.2f}'
    info['nominal'] = nominal

    loop = None
    decay = 0.0
    n_keep = x.shape[1]
    per = period_of(pitch, sr) if c.pitched else None
    if mode == 'sustain':
        if c.swell_db is not None:
            # a crescendo roll: grown evenly in dB from its beat into its peak, where the loop is
            # found next (so a roll note of any length swells into its end: even_crescendo)
            x, sw = even_crescendo(x, sr, pre, c.swell_db)
            info.update(sw)
        use_sfz = (spec.use_sfz_loop and loop_src and loop_src[1] <= min(x.shape[1], pre + spec.max_sfz_end * sr)
                   and loop_src[0] > pre + fin)
        if use_sfz:
            ls, le = loop_src
            corr = loop_corr(x, sr, ls, le)
            info['loop'] = 'sfz'
        flatten = False
        if not use_sfz:
            L = int(loop_len * sr)
            if per:
                L = int(round(max(1, round(L / per)) * per))
            span = max(0.15 * L, 1.2 * per) if per else 0.15 * L
            # waveform correlation, then envelope match (+-60 ms) so the seam joins equal levels. The
            # loop must not pump: its level range as it loops (20 ms RMS) may exceed the sustain's own
            # range before the earliest loop start by LOOP_RANGE_TOL at most (a breath dip, a re-bow or
            # the note's release inside it would come back at every pass). Where the default window
            # has no such loop, a loop half as long (it fits between the dips) and then later starts are
            # searched; if none has, the flattest loop found is pulled back into that range
            # (flatten_sustain_loop).
            r0 = min(x.shape[1] - 1, pre + fin + int(0.15 * sr))
            r1 = min(x.shape[1], max(r0 + int(0.1 * sr), pre + fin + int(spec.loop_min * sr)))
            lim = env_range_db(x, sr, r0, r1) + LOOP_RANGE_TOL
            L2 = int(round(max(1, round(L / 2 / per)) * per)) if per else L // 2
            span2 = max(0.15 * L2, 1.2 * per) if per else 0.15 * L2
            found = None
            for k, (a_s, b_s, ln, sp) in enumerate(((spec.loop_min, spec.loop_max, L, span),
                                                   (spec.loop_min, spec.loop_max, L2, span2),
                                                   (spec.loop_max, spec.loop_max + 0.6, L, span))):
                a = pre + fin + int(a_s * sr)
                b = min(pre + fin + int(b_s * sr), x.shape[1] - int(ln + sp) - int(0.03 * sr))
                if b <= a:
                    continue
                cl, ce, cc = find_loop(x, sr, a, b, int(ln - sp), int(ln + sp), n_starts=24, env_ctx=0.06,
                                       env_k=0.06, range_lim=lim)
                rg = env_range_db(x, sr, cl, ce, circular=True)
                if found is None or (rg <= lim) > (found[3] <= lim) or (rg > lim and found[3] > lim and rg < found[3]):
                    found = (cl, ce, cc, rg, k)
                if rg <= lim:
                    break
            ls, le, corr, rg, k = found
            info['loop'] = 'found'
            info['loop_range'] = (round(rg, 1), round(lim, 1))
            if k:
                info['loop_window'] = ('', 'short', 'later')[k]
            flatten = rg > lim
        info['loop_corr'] = round(corr, 4)
        xf = int(min(spec.xfade * sr, (le - ls) / 3))
        x = crossfade_loop(x, ls, le, xf)
        if flatten:
            x, rg2 = flatten_sustain_loop(x, sr, ls, le, lim)
            info['loop_flattened'] = round(rg2, 1)
        if spec.single_reed and c.pitched:
            # musette → one reed (dry accordion voicings): attack as recorded, then the lower reed alone;
            # what is left of the other reed's beating (its partials' leakage) is levelled to +-1 dB
            x, ls, le, rinfo = single_reed(x, sr, pre + fin + int(0.08 * sr), ls, le, mtof(pitch))
            info.update(rinfo)
            if 'kept' in rinfo.get('reed', ''):
                x, rg2 = flatten_sustain_loop(x, sr, ls, le, 2.0)
                info['reed_loop_range'] = round(rg2, 1)
        # the loop (as it plays: after the crossfade, repeated) is what long notes sound like: (re)measure
        # the pitch over 1.3-2.5 s of a held note (the instrument suite's window: a frame-wise reading
        # of one pass of a loop of beating reeds / vibrato weighs its frames differently)
        if c.pitched and not info.get('trusted') and 'pitch_fallback' not in info and le - ls > int(0.15 * sr):
            linfo: dict = {}
            held = played_note(x, ls, le, pre + int(2.6 * sr))
            pl = measure_zone_pitch(spec, held, sr, pre + int(1.3 * sr), pre + int(2.5 * sr),
                                    round(pitch * 2) / 2 if spec.pitch_method == 'hsum' else pitch, 0.6, linfo)
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
            am = env_range_db(x, sr, ls, le, detrend=True)
            if am > DECAY_AM_LIM:
                # a beat null (or swell) inside the loop: more than the envelope correction can take
                # out, it would flutter at the loop rate — earlier starts, the flattest loop that
                # correlates
                l2, e2, c2 = find_loop(x, sr, max(pre + int(0.15 * sr), ls_target - int(0.3 * sr)), ls_target,
                                       int(L - span), int(L + span), env_ctx=0.03, env_k=0.02, range_lim=DECAY_AM_LIM,
                                       range_detrend=True)
                am2 = env_range_db(x, sr, l2, e2, detrend=True)
                if am2 < am:
                    info['loop_moved_am'] = (round(am, 1), round(am2, 1))
                    ls, le, corr, am = l2, e2, c2, am2
            # the decay the loop must continue: the recording's own over the 400 ms before the loop
            # (at least 150 ms, else including the loop) — a fit over the loop and the 80 ms before it
            # follows the beating of courses / partials instead (tails that froze or died)
            d0 = max(pre + int(0.06 * sr), ls - int(0.4 * sr))
            slope_pre = decay_slope(x, sr, d0, ls if ls - d0 >= int(0.15 * sr) else le, per)
            if (slope_pre is None or slope_pre > -spec.min_decay) and ls - (pre + int(0.06 * sr)) >= int(0.15 * sr):
                # a beat swelling over those 400 ms (the envelope rises): the whole stored decay
                s_all = decay_slope(x, sr, pre + int(0.06 * sr), ls, per)
                if s_all is not None and (slope_pre is None or s_all < slope_pre):
                    slope_pre = s_all
            # beating string courses / partials: pull the envelope onto that decay line (natural
            # signal, eased in before the loop) so the repeated loop does not flutter
            a0 = max(pre + int(0.05 * sr), ls - int(0.08 * sr))
            x, slope, resid = flatten_loop_envelope(x, sr, a0, ls, le, per, slope=slope_pre)
            info['loop_am_db'] = round(resid, 1)
            info['decay_pre'] = None if slope_pre is None else round(slope_pre, 1)
            decay = float(min(-spec.min_decay, slope))
            # flatten the loop region so the runtime decay continues the natural one
            k = math.log(10) / 20 * (-decay)
            idx = np.arange(ls, le)
            x = x.copy()
            x[:, ls:le] *= np.exp(k * (idx - ls) / sr)
            # what the envelope correction left between the loop's two ends (a level step at every
            # seam): levelled by a tilt across the loop body, before the crossfade joins its end to
            # the material leading into ls
            w = int(max(0.02 * sr, 3 * per if per else 0))
            if le - ls > 4 * w:
                tilt = db(rms(to_mono(x[:, ls:ls + w]))) - db(rms(to_mono(x[:, le - w:le])))
                if abs(tilt) > 0.3:
                    x[:, ls:le] *= 10 ** (tilt * (idx - ls) / (le - 1 - ls) / 20)
                    info['loop_tilt_db'] = round(tilt, 1)
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
    # the beat where the finished zone is heard to start (struck / plucked / section attacks, not
    # swells): the first point where the RMS over the preceding 5 ms comes within 10 dB of its maximum
    # over the 0.5 s after the beat (full band; the attack test of the instrument suite). The attack
    # model's onset can sit up to 12 ms off it (a slow low string, quill / finger noise, the fade-in
    # of a section attack, a band-limited reading of a note whose peak comes later)
    swell = (c.onset_db if c.onset_db is not None else spec.onset_db) <= -15
    if amode in ('transient', 'perceptual') and not swell:
        info['beat_check'] = True  # re-checked on the decoded MP3 (build_set)
        on10 = onset10_index(x, sr, pre)
        if abs(on10 - pre) > int(BEAT_TOL * sr):
            info['beat_moved_ms'] = round((on10 - pre) * 1000 / sr, 1)
            pre = on10
    # loudness → gain
    if spec.loud_max:
        lu = max_short_loudness(x, sr, pre, x.shape[1])
    elif loop and mode == 'sustain':
        # what a held note plays (the loop repeated): its body from 0.1 to 2.5 s, as the suite measures
        lu = loudness(played_note(x, loop[0], loop[1], pre + int(2.5 * sr)), sr, pre + int(0.1 * sr), pre + int(2.5 * sr))
    else:
        lu = loudness(x, sr, pre + int(spec.loud_win[0] * sr), pre + int(spec.loud_win[1] * sr))
    # every transient / perceptual zone keeps pre_ms of pre-roll before its attack, padded with
    # silence when the recording starts right at the attack: the MP3 pre-echo of the transient then
    # lands in that silence (the runtime fades the pre-roll in) instead of being cut into a step.
    # Sets with hit_ramp keep pre_ms before the attack's RISE (attack_points info['hit_pad']): a hit
    # recorded from its stroke plays its whole rise, behind a hit_ramp ramp only
    want = int(round(spec.pre_ms * sr / 1000))
    pad = want - pre if amode != 'sustain' and pre < want else 0
    pad = max(pad, int(info.get('hit_pad', 0)))
    if pad > 0:
        x = np.pad(x, ((0, 0), (pad, 0)))
        pre += pad
        if loop:
            loop = (loop[0] + pad, loop[1] + pad)
        info['padded'] = pad
    pk = float(np.max(np.abs(x))) + 1e-12
    norm = PEAK / pk
    x = x * norm
    lu_n = lu + db(norm)
    gain = 10 ** ((TARGET_LU + c.level_db - lu_n) / 20)
    if loop:
        info['seam'] = round(seam_click(x, loop[0], loop[1]), 2)
    return Zone(c, x, pitch, pre, loop, decay, gain, lu_n, info)


def played_note(x: np.ndarray, ls: int, le: int, n: int) -> np.ndarray:
    """A sustained zone as a held note plays it: up to le, then [ls, le) repeated, n samples long."""
    x = np.atleast_2d(x)
    if n <= le:
        return x[:, :n]
    reps = int(math.ceil((n - le) / max(1, le - ls)))
    return np.concatenate([x[:, :le], np.tile(x[:, ls:le], (1, reps))], axis=1)[:, :n]


def fade_in_curve(n: int) -> np.ndarray:
    """Raised-cosine fade-in over n samples, as the runtime applies a zone's `fi` (sampled.ts)."""
    return 0.5 - 0.5 * np.cos(np.pi * (np.arange(n) + 0.5) / n)


def sustain_beat(dz: np.ndarray, sr: int, zd: dict) -> tuple[dict, dict]:
    """The beat of a sustained zone on the perceptual onset of what it plays (see SUS_MAX_PRE).
    `dz`: the zone decoded from the sprite (mono, from its built start `o`, `n` samples), `zd`: its
    built manifest entry. The onset is instrument_dsp.perceptual_onset on the held note (the loop
    repeated, measured over max(5 ms, one period of the zone's pitch)): where the RMS comes within 10 dB
    of its maximum over the next 0.5 s — what the instrument suite's att10 measures, so the zone sounds
    on the beat like a plucked one — or, for a note that dwells on a plateau below that, its attack.
    Returns the fields to update — `pre`; for a quiet build-up longer than SUS_MAX_PRE also the later
    zone start (`o`, `n`, `ls`, `le` shifted by the cut, the audio itself untouched) and the fade-in `fi`
    the runtime applies over the kept pre-roll — and the onset details (report)."""
    pre = int(zd['pre'])
    ls, le = zd.get('ls'), zd.get('le')
    need = pre + int(2.0 * sr)
    if ls is not None and le is not None and le - ls > 16:
        m = to_mono(played_note(dz, ls, le, need))
    else:
        m = np.pad(np.asarray(dz, dtype=np.float64), (0, max(0, need - len(dz))))
    period = sr / mtof(zd['p'])
    cap = int(round(SUS_MAX_PRE * sr))
    gap = int(round(SUS_FADE_GAP * sr))
    p, info = perceptual_onset(m, sr, pre, period)
    if p <= cap:
        return {'pre': p}, info
    # a build-up longer than SUS_MAX_PRE: entered SUS_MAX_PRE before the beat with a short fade-in, where
    # it is still quiet (the onset measured again on the faded note: the fade can only lower what precedes
    # the beat); a louder build-up keeps the recording's start: its beat where it is when every key of the
    # zone can carry that pre-roll, else as late as they can (the end of the build-up sounds a little early
    # instead of an attack being cut)
    keep = int(RT_MAX_PRE * 2 ** ((min(zd.get('lo', zd['p']), zd['p']) - zd['p']) / 12) * sr)
    e = onset_power(m, sr, period)
    top = float(e[:min(len(e), info['p10'] + int(round(0.5 * sr)))].max())
    w5 = int(round(0.005 * sr))
    kr = int(round(SUS_CUT_RISE_WIN * sr))
    s0, fi = 0, 0
    for _ in range(6):
        s0 = p - cap
        # everything cut away (up to the entry point's 5 ms window): its loudest point, and the steepest
        # climb (SUS_CUT_RISE_WIN) to an audible level within it
        dcut = 10 * np.log10(e[:min(len(e), s0 + w5)] / top + 1e-20)
        lvl = float(dcut.max())
        loud = np.nonzero(dcut > SUS_CUT_ATTACK_DB)[0]
        climb = max((float(dcut[t] - dcut[max(0, t - kr)]) for t in loud), default=0.0)
        if lvl > SUS_CUT_DB or climb >= SUS_CUT_RISE:
            info['capped_db'] = round(lvl, 1)
            if climb >= SUS_CUT_RISE:
                info['capped_climb_db'] = round(climb, 1)
            return {'pre': max(cap, min(p, keep))}, info
        fi = max(int(round(0.002 * sr)), min(int(round(SUS_FADE * sr)), p - s0 - gap))
        y = m[s0:].copy()
        y[:fi] *= fade_in_curve(fi)
        # (fading what precedes the beat leaves the -10 dB point as it is and can only shorten a dwell:
        # the onset of what plays is the same or later — iterate until the entry point holds)
        q, qi = perceptual_onset(y, sr, p - s0, period)
        info = {**qi, 'p10': qi['p10'] + s0, 'cut_db': round(lvl, 1)}
        for k in ('attack', 'p15'):
            if k in qi:
                info[k] = qi[k] + s0
        q += s0
        if q <= p:
            fi = min(fi, max(int(round(0.002 * sr)), q - s0 - gap))
            p = q
            break
        p = q
    out = {'o': zd['o'] + s0, 'n': zd['n'] - s0, 'pre': p - s0, 'fi': fi}
    if ls is not None and le is not None:
        out['ls'] = ls - s0
        out['le'] = le - s0
    return out, info


def rebeat_zones(s: dict, dec: np.ndarray, shift: int) -> None:
    """sustain_beat for every zone of a built set (manifest entries `s['zones']`, updated in place)
    from its decoded sprite `dec` (marker offset `shift`). Each zone keeps its geometry as built
    (`_built`, not written to the manifest), so beats can be placed again from the same state; the
    onset details go to `_onset` (build state only, for the report)."""
    mono = to_mono(dec)
    for zd in s['zones']:
        built = zd.get('_built') or {k: zd[k] for k in ('o', 'n', 'pre', 'ls', 'le') if k in zd}
        base = {k: v for k, v in zd.items() if not k.startswith('_') and k not in ('fi', 'ga', 'dw')}
        base.update(built)
        o = base['o'] + shift
        upd, info = sustain_beat(mono[o:o + base['n']], s['sr'], base)
        zd.clear()
        zd.update(base)
        zd.update(upd)
        # the gate anchor: the attack model's beat (where the zone's notes were gated from when the
        # songs' note lengths and the loudness calibration were made), kept in the zone's audio while
        # the note is placed by its perceptual onset `pre` (sampled.ts ZoneDef.ga)
        ga = max(0, built['o'] + built['pre'] - zd['o'])
        if ga != zd['pre']:
            zd['ga'] = ga
        # how far the beat moved from the -10 dB point onto the attack of a dwell (perceptual_onset `w`):
        # the runtime keeps such takes' beats when it sums two of them (sampled.ts renderZone)
        if info.get('w'):
            zd['dw'] = round(float(info['w']), 2)
        zd['_built'] = built
        zd['_onset'] = info


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


def cand_files(spec: SetSpec, cands: list[Cand]) -> dict[str, list[str]]:
    """repository -> the source files (samples and premixes) the candidates read from it"""
    out: dict[str, set[str]] = {}
    for c in cands:
        out.setdefault(c.repo or spec.repo, set()).update([c.path] + [p for p, _ in c.mix])
    return {r: sorted(ps) for r, ps in out.items()}


def build_set(spec: SetSpec, src: Sources, report: list[str]) -> dict:
    cands = spec.cands(src)
    for repo, paths in cand_files(spec, cands).items():
        src.fetch(repo, paths)
    # octave sanity: SFZ / file-name octave conventions differ, so measure a few zones and apply
    # one global octave correction for the set (unless the spec states it)
    zones: list[Zone] = []
    octave = spec.octave if spec.octave is not None else 0.0
    if spec.octave is None and any(c.pitched for c in cands):
        pitched = [c for c in cands if c.pitched]
        probe = pitched[:: max(1, len(pitched) // 7)][:7]
        votes = []
        for c in probe:
            path = src.fetch(c.repo or spec.repo, [c.path])[0]
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
    # takes without a definite pitch (spec.max_disagree): left out, their neighbours cover their keys
    dropped = [z for z in zones if z.info.get('drop')]
    zones = [z for z in zones if not z.info.get('drop')]
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
    # the beat on what plays: coding noise can move the -10 dB point of an attack that hovers near it
    # (a build-up, a plateau) by several ms, so the perceptual onset is measured again on the decoded
    # sprite (never earlier than pre_ms of pre-roll: the MP3 pre-echo guard)
    for zd, z in zip(zdefs, zones):
        if not z.info.get('beat_check'):
            continue
        dz = to_mono(dec)[zd['o'] + shift:zd['o'] + shift + zd['n']]
        on = max(min(zd['pre'], int(round(spec.pre_ms * sr / 1000))), onset10_index(dz, sr, zd['pre']))
        if abs(on - zd['pre']) > int(BEAT_TOL * sr):
            z.info['beat_moved_ms'] = round(z.info.get('beat_moved_ms', 0.0) + (on - zd['pre']) * 1000 / sr, 1)
            z.info['beat_decoded'] = True
            zd['pre'] = on
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
    # sustained sets: the stored beat on the perceptual onset of what plays (sustain_beat), once
    # everything measured from the built beat (loop, pitch, loudness, the checks above) is done
    if spec.mode == 'sustain':
        rebeat_zones({'sr': sr, 'zones': zdefs}, dec, shift)
        for zd, z in zip(zdefs, zones):
            b = zd['_built']
            z.info['sus_beat_ms'] = round((zd['o'] + zd['pre'] - b['o'] - b['pre']) * 1000 / sr, 1)
            if 'fi' in zd:
                z.info['sus_cut_ms'] = round((zd['o'] - b['o']) * 1000 / sr, 1)
            if zd['_onset'].get('w'):
                z.info['sus_dwell'] = zd['_onset']['w']
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
                      + (f" hitpad={inf['hit_pad'] * 1000 / sr:.2f}ms ramp={inf.get('hit_ramp_ms')}ms"
                         if inf.get('hit_pad') else '')
                      + (f" level{z.cand.level_db:+.1f}dB" if z.cand.level_db else '')
                      + (f" swell={inf['swell_rate']}dB/s over {inf['swell_ms']}ms gain(start,max,min)={inf['swell_gain']}dB"
                         if 'swell_rate' in inf else '')
                      + (f" spread={inf['pitch_spread']}c" if inf.get('pitch_spread') is not None else '')
                      + (f" check(yin,comb)={inf['pitch_check']}c" if inf.get('pitch_check') is not None else '')
                      + (f" range={inf['loop_range'][0]}/{inf['loop_range'][1]}dB" if inf.get('loop_range') else '')
                      + (f" win={inf['loop_window']}" if inf.get('loop_window') else '')
                      + (f" FLATTENED->{inf['loop_flattened']}dB" if 'loop_flattened' in inf else '')
                      + (f" beat{inf['beat_moved_ms']:+}ms" if 'beat_moved_ms' in inf else '')
                      + (f" heard{inf['sus_beat_ms']:+}ms" if 'sus_beat_ms' in inf else '')
                      + (f" entered+{inf['sus_cut_ms']}ms(faded)" if 'sus_cut_ms' in inf else '')
                      + (f" dwell{inf['sus_dwell']:.2f}" if 'sus_dwell' in inf else '')
                      + (f" decpre={inf['decay_pre']}" if inf.get('decay_pre') is not None else '')
                      + (f" reed: {inf['reed']}" if inf.get('reed') else '')
                      + (f" loopAMmoved={inf['loop_moved_am']}" if 'loop_moved_am' in inf else '')
                      + (f" tilt={inf['loop_tilt_db']}dB" if 'loop_tilt_db' in inf else '')
                      + (f" range={inf['reed_loop_range']}dB" if 'reed_loop_range' in inf else '')
                      + (f" PITCH-FALLBACK({inf['pitch_fallback']})" if 'pitch_fallback' in inf else '')
                      + (f" relabeled{inf['relabeled']:+.2f}" if 'relabeled' in inf else '')
                      + (' narrow' if inf.get('narrow') is not None and 'pitch_fallback' not in inf else ''))
    for z in dropped:
        report.append(f"  DROPPED {z.cand.label} L{z.cand.layer} R{z.cand.rr}: {z.info['drop']}")
    files = cand_files(spec, [z.cand for z in zones])
    out = {'name': spec.name, 'repo': spec.repo, 'sources': files.get(spec.repo, []), 'note': spec.note,
           'file': f'{spec.name}/{spec.name}.mp3', 'sr': sr, 'ch': spec.channels,
           'marker': MARKER, 'win': MARKER_WINDOW, 'bytes': size, 'seconds': round(secs, 2), 'zones': zdefs}
    # zones from another library (Cand.repo): their files by repository, for the credits
    other = {r: ps for r, ps in files.items() if r != spec.repo}
    if other:
        out['other_sources'] = other
    return out


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
        ' *   fi  fade-in from the zone start (a slow swell entered late: sustained pre-roll cap)',
        ' *   ga  gate anchor (sustained): a note\'s gate counts from here, its onset `pre` goes on the beat',
        ' *   dw  dwell weight (sustained): how far the beat moved onto the attack of a note that dwells below -10 dB',
        ' */',
        "import type { SampleSetDef } from '../../sampled';",
        '',
        'export const SAMPLE_SETS: SampleSetDef[] = [',
    ]
    for s in sets:
        # (keys starting with '_' are build state only, e.g. a sustained zone's geometry as built)
        zs = ',\n'.join('      ' + json.dumps({k: v for k, v in z.items() if not k.startswith('_')},
                                              separators=(',', ':')).replace('"', '') for z in s['zones'])
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
    ('sso', 'Samples/Percussion/cymbal_roll', 'CC Sampling Plus 1.0',
     'Suspended-cymbal crescendo roll from Sonatina Symphonic Orchestra, whose README names "davidjwoll cymbal rolls" '
     '(freesound.org pack 5577) among its sources'),
]

# the SSO README's own statement on where its samples came from (quoted in the credits, verbatim)
SSO_PROVENANCE = [
    'SSO was created from the following free/CC-licensed/public domain instrument samples: '
    '[The University of Iowa MIS](http://theremin.music.uiowa.edu/MIS.html), [MSLP](http://www.mediafire.com/?zqff4hkyeec22), '
    '[Philharmonia samples](http://www.philharmonia.co.uk/thesoundexchange/make_music/samples/library/), '
    '[OLPC project](http://wiki.laptop.org/go/Free_sound_samples), '
    '[The Complete K2000](http://www.sweetwater.com/k2000/sounds.html), '
    '[ldk1609 violin](http://www.freesound.org/usersViewSingle.php?id=692375), '
    '[stamperadam Kelon Xylophone](http://www.freesound.org/packsViewSingle.php?id=6168), '
    '[Corsica_S Cello Pizzicato](http://www.freesound.org/packsViewSingle.php?id=2680), '
    '[davidjwoll cymbal rolls](http://www.freesound.org/packsViewSingle.php?id=5577), '
    '[Satoration Castanets](http://www.freesound.org/samplesViewSingle.php?id=57299), '
    "Thores Triangle, Mystified timpani, Eddie's English Horn and a variety of classic soundfonts by Campbell Barton, "
    '[Nando Florestan](http://oui.com.br/n/download.php?list.2), and [Ethan Winer](http://www.ethanwiner.com/ewsf2.html).',
    '',
    'In the case of a few very old soundfonts I have no idea who the original authors were or what licensing might apply. '
    'But as these files have been modified by different people and included in countless GM banks and other soundfont '
    "compilations over the last decade, I'm assuming that they are to be considered public domain or at least free to use "
    'for sampling projects.',
    '',
    'I have done my very best to avoid samples of questionable legality, but as it is impossible for me to know the exact '
    'origin of everything (i.e. I have no way of knowing if a soundfont labeled as "public domain" isn\'t actually sampled '
    'from a proprietary source), I would appreciate if you let me know if you find anything fishy.',
]

# midi-js-soundfonts holds two fonts under different licenses: a set is labelled by the fonts its files come from
GLEITZ_FONTS = {'MusyngKite': 'CC BY-SA 3.0 (MusyngKite)', 'FluidR3_GM': 'CC BY 3.0 (FluidR3_GM)'}


def repo_license(repo: str, paths: list[str]) -> str:
    """The license of the files `paths` of `repo` (the repository's own label; SPECIAL_LICENSES apply on top)."""
    if repo == 'gleitz' and paths:
        return ' / '.join(sorted({GLEITZ_FONTS[p.split('/')[0]] for p in paths}))
    return REPOS[repo][1]

SOURCE_NOTES = {
    'accordion': 'https://github.com/freepats/button-accordion-hn — Hohner button accordion recorded by Jeff Stauffer (2023), '
                 'sent to FreePats via Piotr Barz; bank by michael02022. freepats.zenvoid.org',
    'mandolin': 'https://github.com/sfzinstruments/terkelsen.mandolin — "Terkelsen\'s Mandolin" contributed by Lars Terkelsen, '
                'converted from GigaSampler to SFZ by S. Christian Collins (www.schristiancollins.com). License: not stated '
                '(unknown) — the repository states none; it is used with credit, as the Audio 2.0 brief allows for this '
                'prototype — replace before release if the license cannot be confirmed.',
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
              'CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/); only its MusyngKite font is used.',
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
         '24 kHz for the bass instruments and the dry accordion, 44.1 kHz for some percussion), mono unless noted, looped/crossfaded,',
         'loudness-normalised and MP3-encoded (libmp3lame VBR) — modified versions of the originals.',
         f'Total: {len(sets)} MP3 sprites, {total:,} bytes = {total / 1e6:.3f} MB (SI; {total / 1048576:.2f} MiB).', '',
         '## Attribution lines (for the game credits)', '',
         '- Accordion: "Button Accordion HN" — FreePats project (Hohner accordion recorded by Jeff Stauffer; bank by michael02022), CC0 1.0.',
         '- Mandolin: "Terkelsen\'s Mandolin" by Lars Terkelsen, SFZ conversion by S. Christian Collins (license: not stated',
         '  (unknown); credited).',
         '- Piano, nylon guitar, steel guitar: "Meta Open Sound" by Meta (Creative Audio team), CC0 1.0.',
         '- Orchestra (strings, brass, woodwinds, chorus, organ, harp, mallets, timpani, tam-tam, suspended-cymbal roll):',
         '  "Sonatina Symphonic Orchestra" by Mattias Westlund and Peter Eastman, CC Sampling Plus 1.0; horn section sustains by',
         '  Mattias Westlund, CC BY-SA 3.0; celesta by stamperadam (freesound.org), CC0 1.0; pipe organ: "St. Stephen\'s',
         '  Anglican" recorded by Nicholas Appleton, CC Sampling Plus 1.0; the cymbal roll is from the cymbal rolls SSO took',
         '  from davidjwoll (freesound.org), CC Sampling Plus 1.0.',
         '- Harpsichord, percussion (tambourine, snare, cymbals, bass drums, triangle, shaker, brake drum, anvil, slapstick,',
         '  woodblock, vibraslap, flexatone, claves, ratchet, toy whistle): "Versilian Community Sample Library" by Versilian',
         '  Studios, CC0 1.0.',
         '- Castanets: "World Percussion" — FreePats project, CC0 1.0.',
         '- Orchestra hit: "Musyng Kite" soundfont via midi-js-soundfonts (Benjamin Gleitzman), CC BY-SA 3.0.',
         '', '## Sources', '']
    # every repository a set reads from (its own and, for mixed sets, Cand.repo), with the files it reads
    used: dict[str, set[str]] = {}
    for s in sets:
        used.setdefault(s['repo'], set()).update(s['sources'])
        for r, ps in s.get('other_sources', {}).items():
            used.setdefault(r, set()).update(ps)
    for repo in sorted(used):
        lic = repo_license(repo, sorted(used[repo]))
        L.append(f'- **{repo}** ({lic}): {SOURCE_NOTES.get(repo, REPOS[repo][2])}')
    sso_sets = [s['name'] for s in sets if s['repo'] == 'sso' or 'sso' in s.get('other_sources', {})]
    L += ['', '## Residual provenance notes', '',
          '- Sonatina Symphonic Orchestra (the sets ' + ', '.join(f'`{n}`' for n in sso_sets) + ') was assembled from other',
          '  free libraries and soundfonts. Its README quotes Mattias Westlund\'s statement on the sources and licensing',
          '  of the samples (verbatim):', '']
    L += [('  > ' + p) if p else '  >' for p in SSO_PROVENANCE]
    L += ['',
          '  The SSO-derived files are used under CC Sampling Plus 1.0 (horn section sustains CC BY-SA 3.0, celesta CC0 1.0)',
          '  as SSO distributes them; the caveat above is the one residual provenance risk SSO itself names.',
          '- Mandolin (`mandolin`): license not stated (unknown) — the source repository states none; used with credit for',
          '  this prototype, to be replaced before release unless the license can be confirmed.']
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
          '- Timing: every recording is aligned on its perceptual onset — where the RMS over the preceding 5 ms comes',
          '  within 10 dB of the note\'s peak (att10) — so the attack is on the beat; pick / bow noise and slow build-ups',
          '  sound just before it. Sustained recordings (bowed / blown / sung, the accordion: `instrument_dsp.perceptual_onset`)',
          '  measure that over max(5 ms, one period) of the held note, at most 15 ms after it comes within 15 dB (a slow',
          '  climb or a creep just under -10 dB is heard before it gets there; the beat never sits lower than -15 dB on a',
          '  climb). One that dwells below -10 dB after a real attack (a bow, breath or tongue attack onto a plateau,',
          '  then a slow crescendo) has its beat on that attack instead, 7.5 ms after it crosses -15 dB (zone field `dw`:',
          '  how far, blended in by how slow the climb and how steep the attack is). At most 80 ms of a build-up stays',
          '  before the beat (about 110 ms on a note played a fourth below its recording); a slower swell is entered',
          '  later with a 20 ms fade-in, only where everything cut away is 20 dB or more below the note\'s peak and holds',
          '  no attack out of silence (otherwise the recording keeps its start and a longer pre-roll). A note keeps its',
          '  sounding length: its gate counts from the attack model\'s beat (`ga`, what the songs\' note lengths and',
          '  loudness calibration were made with) and the note is moved so that its onset lands on the beat, so short',
          '  notes of slow attacks are not lengthened. A note shifted from its recording keeps its zone\'s beat (the same',
          '  point of the attack, played faster or slower); a note gated before its attack peaks goes on the same rule',
          '  relative to its own peak (smoothed over level bands: it changes evenly with the note\'s length and meets the',
          '  whole note\'s beat); two takes played together (`width`) are aligned on their beats and placed on the onset',
          '  of their sum, within 25 ms (less where they sit on the attack of a dwell), each note at the loudness it had',
          '  with the takes aligned on their gate anchors (what the songs were balanced with); a tone-filtered voicing',
          '  (`accChord`) moves its beat by what its filters move the attack.',
          '- `accordion` plays the recorded musette (two reeds about +5 and +28 cents, beating about 7 Hz at C5);',
          '  `accordionDry` / `accChord` play its lower reed alone (set `accdry`: the recorded attack, then the higher',
          '  reed removed from the loop spectrum), mono, with their own tone (low-pass, high-pass) — no musette beating.',
          '- Stereo: mono recordings of ensembles and cymbals (`strings`, `strStab`, `choir`, `choirO`, `accordion`,',
          '  `brass`, `brassSoft`, `organ`, `crash`, `tamtam`) play a second take or the neighbouring recording on the',
          '  right channel; `cymbal` is a stereo recording.',
          '- Variants keep the synth meaning: `timpani` variant 1 is the soft stroke (-4.5 dB); `tamb` accents (4, 5)',
          '  are +2 dB, shakes (2, 3) -3.5 dB; `cymbal` / `bassDrum` variant 1 is the roll at any velocity.',
          '- `cymbal` variant 1 is a crescendo roll (SSO): a note grows evenly (about 10 dB/s, from 9 dB under the',
          '  roll\'s peak, brightening from about 1 to 4 kHz) for its first 0.76 s, then holds the peak — slower than its',
          '  0.6 s release decays, so a roll note of any length is at its loudest at its end (the downbeat it swells into).',
          '  The held roll plays at the level of the earlier (VCSL) roll.',
          '- Notes written without a variant cycle the takes only, never an articulation: `bassDrum` / `cymbal` / `ratchet`',
          '  / `toyWhistle` stay on variant 0, `timpani` alternates its two takes at the same level (variant 2 = the',
          '  second take at full level), `tamb` and `flexatone` alternate their two plain takes; ask for a roll, a shake or',
          '  the soft stroke with `vr`.',
          '- `strStab`: two takes sound together (stereo width), so the beat is on the onset of their sum; short notes',
          '  (a gate shorter than the attack takes to peak) start on their own onset.',
          '- `steelGuitar` has one velocity layer (Meta Vel02; the 5 MB budget leaves no room for Vel01 / Vel03).',
          '', 'Share-alike: the files derived from CC BY-SA 3.0 sources (`horns`, `orchhit`) are themselves CC BY-SA 3.0;',
          'the files derived from Sonatina Symphonic Orchestra are under CC Sampling Plus 1.0.', '',
          '## Sample sets (file → instruments → exact source files)', '']
    for s in sets:
        ids = ', '.join(f'`{i}`' for i in users.get(s['name'], [])) or '—'
        L.append(f"### `{s['file']}` — {len(s['zones'])} zones, {s['seconds']:.1f} s, {s['bytes'] / 1024:.0f} KB")
        L.append(f'- instruments: {ids}')
        # the set's own repository, then any other one its zones come from (Cand.repo)
        by_repo = [(s['repo'], s['sources'])] + sorted(s.get('other_sources', {}).items())
        for repo, paths in by_repo:
            lic = repo_license(repo, paths)
            special = [(lc, at) for (r, sub, lc, at) in SPECIAL_LICENSES if r == repo and any(sub in p for p in paths)]
            if special:
                lic = ' / '.join(sorted({lc for lc, _ in special}))
            L.append(f'- source: {REPO_URL.get(repo, repo)}, license: {lic}')
            for lc, at in special:
                L.append(f'  - {at} ({lc})')
        if s.get('note'):
            L.append(f"- {s['note']}")
        if len(by_repo) == 1:
            L.append('- files: ' + '; '.join(f'`{p}`' for p in s['sources']))
        else:
            for repo, paths in by_repo:
                L.append(f'- files ({repo}): ' + '; '.join(f'`{p}`' for p in paths))
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
    ap.add_argument('--rebeat', default='', help="sustained sets ('all' = every one) whose beats are placed again "
                    '(sustain_beat) on their MP3s as built, without re-encoding; then manifest.ts + credits are '
                    'rewritten from the build state (implies --docs-only)')
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
    if args.docs_only or args.rebeat:
        out = [prev[sp.name] for sp in SETS if sp.name in prev]
        SETS_TO_BUILD: list[SetSpec] = []
        sus = {sp.name: sp for sp in SETS if sp.mode == 'sustain'}
        want = set(sus) if args.rebeat == 'all' else {s for s in args.rebeat.split(',') if s}
        for s in out:
            if s['name'] not in want:
                continue
            if s['name'] not in sus:
                raise SystemExit(f"--rebeat: {s['name']} is not a sustained set")
            # the sprite exactly as the runtime decodes it (marker alignment as in build_set)
            dec, _ = decode_mp3(os.path.join(OUT_DIR, s['file']))
            if os.path.getsize(os.path.join(OUT_DIR, s['file'])) != s['bytes']:
                raise SystemExit(f"--rebeat: {s['file']} is not the MP3 of this build state")
            shift = int(np.argmax(np.abs(to_mono(dec)[:MARKER_WINDOW]))) - MARKER
            rebeat_zones(s, dec, shift)
            moved = [(z['o'] + z['pre'] - z['_built']['o'] - z['_built']['pre']) * 1000 / s['sr'] for z in s['zones']]
            zs = s['zones']
            print(f"{s['name']:11s} beats moved {min(moved):+.1f}..{max(moved):+.1f} ms (median "
                  f"{float(np.median(moved)):+.1f}); {sum(1 for z in zs if z['_onset'].get('w'))} of {len(zs)} on the "
                  f"attack of a dwell (fully {sum(1 for z in zs if z['_onset'].get('w') == 1)}), "
                  f"{sum(1 for z in zs if 'fi' in z)} swells entered late, {sum(1 for z in zs if 'capped_db' in z['_onset'])} "
                  f"build-ups kept whole (pre-roll over {SUS_MAX_PRE * 1000:.0f} ms: "
                  f"{max([z['pre'] * 1000 / s['sr'] for z in zs if 'capped_db' in z['_onset']] or [0]):.0f} ms)", flush=True)
        missing = want - {s['name'] for s in out}
        if missing:
            raise SystemExit(f"--rebeat: no build state for {', '.join(sorted(missing))}")
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
            files = cand_files(sp, sp.cands(src))
            o['sources'] = files.get(sp.repo, [])
            other = {r: ps for r, ps in files.items() if r != sp.repo}
            if other:
                o['other_sources'] = other
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
