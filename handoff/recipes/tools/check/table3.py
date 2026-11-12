#!/usr/bin/env python3
"""Markdown results table: python3 table3.py <nopantry tags> <god tags>   (comma lists)"""
import json, sys, glob, statistics as S
I = '/tmp/claude-0/-home-user-kitchenfight/99284fd8-7f84-5a9c-a2f9-07af06a20ff0/scratchpad/recipes/work/integrate/check/sims/'
ORDER = ['pomodoro', 'carbonara', 'alfredo', 'amatriciana', 'margherita', 'cacioepepe', 'marinara', 'ragu', 'pesto', 'vongole', 'foodcourt', 'old kitchen', 'old trattoria', 'old streets', 'old foodcourt']
TIER = {'pomodoro': 'T1', 'carbonara': 'T2', 'alfredo': 'T3', 'amatriciana': 'T3', 'margherita': 'T3', 'cacioepepe': 'T4', 'marinara': 'T4', 'ragu': 'T5', 'pesto': 'T5', 'vongole': 'T5', 'foodcourt': 'T6'}


def load(tags, pre=''):
    rows = {}
    if not tags: return rows
    for spec in tags.split(','):
        tag, _, only = spec.partition(':')
        only = set(only.split('+')) if only else None
        for f in glob.glob(I + tag + '/*.jsonl'):
            for l in open(f):
                if l.startswith('{'):
                    d = json.loads(l)
                    if only and d['stage'] not in only: continue
                    rows.setdefault((pre + d['stage'], d['skill']), []).append(d)
    return rows


A = load(sys.argv[1]); G = load(sys.argv[2])
if len(sys.argv) > 4:
    A.update(load(sys.argv[3], 'old ')); G.update(load(sys.argv[4], 'old '))
old = '--old' in sys.argv


def mr(xs, f='{:.0f}'):
    return (f + ' [' + f + '–' + f + ']').format(S.mean(xs), min(xs), max(xs)) if xs else '–'


def top(rs, keys):
    agg = {}; tot = 0
    for r in rs:
        for k in keys:
            for a, b in r['src'].get(k, {}).items():
                agg[a] = agg.get(a, 0) + b; tot += b
    if not tot: return '–'
    a, b = max(agg.items(), key=lambda x: x[1])
    a = a.replace('shot:proj.e_', 'shot ').replace('area:', 'cloud/slick ').replace('slam:', 'slam ').replace('b_', 'boss ')
    return f'{a} {b / tot * 100:.0f}%'


print('| Dish | Tier | No pantry sk 1: survival s | sk 0.6 | deaths <200 s (of n) | Mid pantry, auto-revive: deaths 0–25 min | deaths 5–15 | dmg/min 5–15 | first death s | boss kill s 5:00 / 10:00 / 15:00 (killed/n) | top damage 5–15 |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
for st in ORDER:
    a1 = A.get((st, 1), []); a6 = A.get((st, 0.6), []); g = G.get((st, 1), [])
    if not (a1 or g): continue
    early = sum(1 for r in a1 + a6 if r['dead'] and r['time'] < 200)
    cells = [st, TIER.get(st, 'old'), mr([r['time'] for r in a1]) + f' (n{len(a1)})', mr([r['time'] for r in a6]) + f' (n{len(a6)})', f'{early}/{len(a1) + len(a6)}']
    if g:
        cells += [mr([len(r['deaths']) for r in g], '{:.1f}') + f' (n{len(g)})', mr([sum(1 for x in r['deaths'] if 300 <= x < 900) for r in g], '{:.1f}'),
                  mr([sum(r['dpm'][5:15]) / 10 for r in g]), mr([r['deaths'][0] if r['deaths'] else r['time'] for r in g])]
        bs = {}
        for r in g:
            for b in r['bosses']: bs.setdefault(b['at'], []).append(b)
        parts = []
        for at in (300, 600, 900):
            bl = bs.get(at, [])
            ks = [b['kill'] for b in bl if b['kill'] is not None]
            parts.append((f"{bl[0]['id'][2:]} " if bl else '') + (f"{S.mean(ks):.0f} [{min(ks)}–{max(ks)}] ({len(ks)}/{len(bl)})" if ks else f'– (0/{len(bl)})'))
        cells += [' / '.join(parts), top(g, ['bw', 'bB'])]
    else:
        cells += ['–'] * 6
    print('| ' + ' | '.join(cells) + ' |')
