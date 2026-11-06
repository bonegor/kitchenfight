#!/usr/bin/env python3
"""
Deterministic mutations of an ABC melody (as written by `export-song.mjs --abc`, where every
note carries an explicit accidental) for the compare.py self-test.

  mutate.py IN.abc OUT.abc [--wrong-notes N] [--rhythm N] [--octave-up] [--halve] [--every K]

--wrong-notes N  raise N notes (every K-th note, default K=5) by one letter name (wrong pitch)
--rhythm N       in N bars swap the lengths of the first two adjacent notes that differ
--octave-up      every note one octave higher (uniform transposition +12)
--halve          L:1/8 -> L:1/16 (all note values halved: time-scale change)
"""
import argparse
import re

NOTE = re.compile(r"([=^_]*)([A-Ga-g])([,']*)(\d*(?:/\d+)?)(-?)")
LETTERS = 'CDEFGABcdefgab'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('inp')
    ap.add_argument('out')
    ap.add_argument('--wrong-notes', type=int, default=0)
    ap.add_argument('--every', type=int, default=5)
    ap.add_argument('--rhythm', type=int, default=0)
    ap.add_argument('--octave-up', action='store_true')
    ap.add_argument('--halve', action='store_true')
    a = ap.parse_args()
    lines = open(a.inp).read().splitlines()
    body_start = next(i for i, l in enumerate(lines) if l.startswith('K:')) + 1
    head, body = lines[:body_start], lines[body_start:]
    if a.halve:
        head = [re.sub(r'^L:1/(\d+)', lambda m: f'L:1/{int(m.group(1)) * 2}', l) for l in head]
    text = '\n'.join(body)
    count = [0]
    changed = [0]

    def wrong(m):
        if m.group(0).startswith('%'):
            return m.group(0)
        count[0] += 1
        if changed[0] < a.wrong_notes and count[0] % a.every == 0:
            changed[0] += 1
            acc, letter, octs, ln, tie = m.groups()
            k = LETTERS.index(letter)
            nl = LETTERS[k + 1] if letter not in 'bB' else ('c' if letter == 'B' else "c'")
            if letter == 'b':
                return f"{acc}c'{octs}{ln}{tie}"
            return f'{acc}{nl}{octs}{ln}{tie}'
        return m.group(0)

    def octave(m):
        acc, letter, octs, ln, tie = m.groups()
        if letter.isupper():
            if octs.startswith(','):
                return f'{acc}{letter}{octs[1:]}{ln}{tie}'
            return f'{acc}{letter.lower()}{octs}{ln}{tie}'
        return f"{acc}{letter}{octs}'{ln}{tie}"

    out_lines = []
    bar_no = 0
    swapped = 0
    for line in text.split('\n'):
        if line.startswith('%') or not line.strip():
            out_lines.append(line)
            continue
        if a.wrong_notes:
            line = NOTE.sub(wrong, line)
        if a.octave_up:
            line = NOTE.sub(octave, line)
        if a.rhythm:
            bars = line.split('|')
            for bi, bar in enumerate(bars):
                if not bar.strip() or bar.strip() == ']':
                    continue
                bar_no += 1
                if swapped >= a.rhythm:
                    continue
                toks = bar.split()
                notes = [i for i, t in enumerate(toks) if NOTE.fullmatch(t)]
                for x, y in zip(notes, notes[1:]):
                    m1, m2 = NOTE.fullmatch(toks[x]), NOTE.fullmatch(toks[y])
                    if m1.group(4) == m2.group(4):
                        continue
                    toks[x] = f'{m1.group(1)}{m1.group(2)}{m1.group(3)}{m2.group(4)}{m1.group(5)}'
                    toks[y] = f'{m2.group(1)}{m2.group(2)}{m2.group(3)}{m1.group(4)}{m2.group(5)}'
                    bars[bi] = ' ' + ' '.join(toks) + ' '
                    swapped += 1
                    break
            line = '|'.join(bars)
        out_lines.append(line)
    open(a.out, 'w').write('\n'.join(head + out_lines) + '\n')
    print(f'mutate: {changed[0]} wrong notes, {swapped} rhythm swaps' + (', octave up' if a.octave_up else '') + (', halved' if a.halve else ''))


if __name__ == '__main__':
    main()
