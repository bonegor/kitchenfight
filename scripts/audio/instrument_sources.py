"""
Source access for the instrument build (scripts/audio/build_instruments.py).

Reads sample files and SFZ maps straight from the local git clones listed in the Audio 2.0 brief.
Most clones are *blobless* partial clones without a checkout, so files are materialised into a
cache directory with a throw-away index (one batched promisor fetch per call) and the clones'
own index / working tree are never touched.
"""
from __future__ import annotations

import os
import re
import subprocess
import tempfile
from dataclasses import dataclass, field

HOME = os.environ.get('KF_SOURCES_HOME', '/home/user')

# name -> (path of the clone, license, attribution)
REPOS = {
    'accordion': (f'{HOME}/freepats/button-accordion-hn', 'CC0 1.0',
                  'FreePats "Button Accordion HN" (Hohner accordion recorded by Jeff Stauffer; bank by michael02022)'),
    'mandolin': (f'{HOME}/sfzinstruments/terkelsen.mandolin', 'free sample set, no license stated (credited)',
                 "Terkelsen's Mandolin by Lars Terkelsen, SFZ conversion by S. Christian Collins"),
    'meta': (f'{HOME}/facebookincubator/meta-open-sound', 'CC0 1.0', "Meta Open Sound (Meta Creative Audio team)"),
    'sso': (f'{HOME}/peastman/sso', 'CC Sampling Plus 1.0',
            'Sonatina Symphonic Orchestra by Mattias Westlund, maintained by Peter Eastman'),
    'vcsl': (f'{HOME}/sgossner/vcsl', 'CC0 1.0', 'Versilian Community Sample Library (VCSL) by Versilian Studios / Sam Gossner'),
    'worldperc': (f'{HOME}/freepats/world-percussion', 'CC0 1.0', 'FreePats World Percussion'),
    'gleitz': (f'{HOME}/gleitz/midi-js-soundfonts', 'CC BY-SA 3.0 (MusyngKite) / CC BY 3.0 (FluidR3_GM)',
               'midi-js-soundfonts by Benjamin Gleitzman (MusyngKite soundfont by Ronald Gonzalez / FluidR3 GM by Frank Wen)'),
}


def git(repo: str, *args: str, env: dict | None = None, input_bytes: bytes | None = None) -> bytes:
    e = dict(os.environ)
    if env:
        e.update(env)
    r = subprocess.run(['git', '-C', repo, *args], env=e, input=input_bytes, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f'git {" ".join(args[:3])} failed in {repo}: {r.stderr.decode(errors="replace")[:400]}')
    return r.stdout


class Sources:
    """Materialises files from the clones into `cache/<name>/<path>`."""

    def __init__(self, cache: str):
        self.cache = cache
        os.makedirs(cache, exist_ok=True)
        self._trees: dict[str, list[str]] = {}

    def repo(self, name: str) -> str:
        return REPOS[name][0]

    def ls(self, name: str, prefix: str = '') -> list[str]:
        """All file paths at HEAD (no blob access, cheap)."""
        if name not in self._trees:
            out = git(self.repo(name), 'ls-tree', '-r', '-z', '--name-only', 'HEAD')
            self._trees[name] = [p for p in out.decode().split('\0') if p]
        return [p for p in self._trees[name] if p.startswith(prefix)]

    def path(self, name: str, rel: str) -> str:
        return os.path.join(self.cache, name, rel)

    def fetch(self, name: str, rels: list[str]) -> list[str]:
        """Ensure files exist in the cache (batched checkout through a temporary index)."""
        missing = [r for r in dict.fromkeys(rels) if not os.path.exists(self.path(name, r))]
        if missing:
            repo = self.repo(name)
            work = os.path.join(self.cache, name)
            os.makedirs(work, exist_ok=True)
            with tempfile.TemporaryDirectory(dir=self.cache) as td:
                env = {'GIT_INDEX_FILE': os.path.join(td, 'index'), 'GIT_LITERAL_PATHSPECS': '1'}
                spec = b'\0'.join(m.encode() for m in missing) + b'\0'
                gitdir = git(repo, 'rev-parse', '--absolute-git-dir').decode().strip()
                e = dict(os.environ)
                e.update(env)
                r = subprocess.run(
                    ['git', f'--git-dir={gitdir}', f'--work-tree={work}', 'checkout', 'HEAD',
                     '--pathspec-from-file=-', '--pathspec-file-nul'],
                    env=e, input=spec, capture_output=True)
                if r.returncode != 0:
                    raise RuntimeError(f'checkout from {repo} failed: {r.stderr.decode(errors="replace")[:600]}')
        return [self.path(name, r) for r in rels]

    def text(self, name: str, rel: str) -> str:
        p = self.fetch(name, [rel])[0]
        with open(p, 'rb') as f:
            return f.read().decode('utf-8', errors='replace')


# ---------------------------------------------------------------------------------------------
# SFZ parsing (enough of the format for the maps we read: headers, opcodes, #include, #define)
# ---------------------------------------------------------------------------------------------

NOTE_RE = re.compile(r'^([a-gA-G])([#b]?)(-?\d+)$')
PC = {'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11}


def sfz_key(v: str) -> int:
    """SFZ key value: number or note name (SFZ convention: c4 = 60)."""
    v = v.strip()
    if re.fullmatch(r'-?\d+', v):
        return int(v)
    m = NOTE_RE.match(v)
    if not m:
        raise ValueError(f'bad key {v!r}')
    n = PC[m.group(1).lower()] + (1 if m.group(2) == '#' else -1 if m.group(2) == 'b' else 0)
    return 12 * (int(m.group(3)) + 1) + n


@dataclass
class Region:
    opcodes: dict[str, str] = field(default_factory=dict)

    def get(self, k: str, default=None):
        return self.opcodes.get(k, default)

    @property
    def sample(self) -> str:
        return self.opcodes['sample'].replace('\\', '/')

    def key(self, k: str, default: int | None = None) -> int | None:
        if k in self.opcodes:
            return sfz_key(self.opcodes[k])
        if k in ('lokey', 'hikey', 'pitch_keycenter') and 'key' in self.opcodes:
            return sfz_key(self.opcodes['key'])
        return default

    def num(self, k: str, default: float = 0.0) -> float:
        try:
            return float(self.opcodes[k])
        except (KeyError, ValueError):
            return default


def parse_sfz(src: Sources, name: str, rel: str) -> list[Region]:
    """Parse an SFZ file (with #include/#define) into fully inherited regions."""
    base_dir = os.path.dirname(rel)
    defines: dict[str, str] = {}

    def load(relpath: str) -> str:
        t = src.text(name, relpath)
        t = re.sub(r'//[^\n]*', '', t)
        out = []
        for line in t.split('\n'):
            s = line.strip()
            m = re.match(r'#define\s+(\$\w+)\s+(.*)$', s)
            if m:
                defines[m.group(1)] = m.group(2).strip()
                continue
            m = re.match(r'#include\s+"([^"]+)"', s)
            if m:
                inc = os.path.normpath(os.path.join(os.path.dirname(relpath), m.group(1).replace('\\', '/')))
                out.append(load(inc))
                continue
            out.append(line)
        return '\n'.join(out)

    text = load(rel)
    for k in sorted(defines, key=len, reverse=True):
        text = text.replace(k, defines[k])
    tokens = re.split(r'(<\w+>)', text)
    levels = {'control': {}, 'global': {}, 'master': {}, 'group': {}}
    regions: list[Region] = []
    cur: dict[str, str] | None = None
    cur_hdr = None

    def opcodes_of(body: str) -> dict[str, str]:
        res: dict[str, str] = {}
        # values may contain spaces (sample paths): split on "name=" boundaries
        parts = re.split(r'\s(?=[A-Za-z_][A-Za-z0-9_]*=)', ' ' + body.strip())
        for p in parts:
            p = p.strip()
            if not p or '=' not in p:
                continue
            k, v = p.split('=', 1)
            res[k.strip()] = v.strip()
        return res

    def flush():
        if cur_hdr == 'region' and cur is not None:
            merged = {}
            for lv in ('control', 'global', 'master', 'group'):
                merged.update(levels[lv])
            merged.update(cur)
            regions.append(Region(merged))

    for tok in tokens:
        m = re.fullmatch(r'<(\w+)>', tok)
        if m:
            flush()
            cur_hdr = m.group(1)
            if cur_hdr in ('global',):
                levels['global'] = {}
                levels['master'] = {}
                levels['group'] = {}
                cur = levels['global']
            elif cur_hdr == 'master':
                levels['master'] = {}
                levels['group'] = {}
                cur = levels['master']
            elif cur_hdr == 'group':
                levels['group'] = {}
                cur = levels['group']
            elif cur_hdr == 'control':
                levels['control'] = {}
                cur = levels['control']
            elif cur_hdr == 'region':
                cur = {}
            else:
                cur = {}
            continue
        if cur is not None:
            cur.update(opcodes_of(tok))
    flush()
    # resolve sample paths relative to the sfz (default_path from <control>)
    for r in regions:
        dp = r.opcodes.get('default_path', '').replace('\\', '/')
        s = r.opcodes.get('sample', '').replace('\\', '/')
        if s:
            r.opcodes['sample'] = os.path.normpath(os.path.join(base_dir, dp, s))
    return regions
