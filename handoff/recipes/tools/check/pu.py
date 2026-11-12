#!/usr/bin/env python3
"""5:00 / 10:00 boss killed before the first death (mid pantry, no auto-revive): python3 pu.py tag[:dish+dish],..."""
import json, glob, sys, statistics as S
I = '/tmp/claude-0/-home-user-kitchenfight/99284fd8-7f84-5a9c-a2f9-07af06a20ff0/scratchpad/recipes/work/integrate/check/sims/'
rows = {}
for spec in sys.argv[1].split(','):
    tag, _, only = spec.partition(':')
    only = set(only.split('+')) if only else None
    for f in glob.glob(I + tag + '/*.jsonl'):
        for l in open(f):
            d = json.loads(l)
            if only and d['stage'] not in only: continue
            rows.setdefault(d['stage'], []).append(d)
for st in ['pomodoro', 'carbonara', 'alfredo', 'amatriciana', 'margherita', 'cacioepepe', 'marinara', 'ragu', 'pesto', 'vongole', 'foodcourt']:
    rs = rows.get(st, [])
    if not rs: continue
    k5 = sum(1 for r in rs if any(b['at'] == 300 and b['kill'] is not None for b in r['bosses']))
    k10 = sum(1 for r in rs if any(b['at'] == 600 and b['kill'] is not None for b in r['bosses']))
    t = [r['time'] for r in rs]
    print(f"| {st} | {S.mean(t):.0f} [{min(t)}–{max(t)}] | {k5}/{len(rs)} | {k10}/{len(rs)} | {sum(1 for r in rs if not r['dead'])}/{len(rs)} |")
