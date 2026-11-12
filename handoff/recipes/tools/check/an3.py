#!/usr/bin/env python3
"""Summarise sim3 batches: python3 an3.py tag[,tag] [--src] [--md]"""
import json, sys, glob, statistics as S
I = '/tmp/claude-0/-home-user-kitchenfight/99284fd8-7f84-5a9c-a2f9-07af06a20ff0/scratchpad/recipes/work/integrate/check/sims/'
ORDER = ['kitchen', 'trattoria', 'streets', 'pomodoro', 'carbonara', 'alfredo', 'amatriciana', 'margherita', 'cacioepepe', 'marinara', 'ragu', 'pesto', 'vongole', 'foodcourt']
tags = sys.argv[1].split(',')
rows = {}
for spec in tags:
    tag, _, only = spec.partition(':')
    only = set(only.split('+')) if only else None
    for f in glob.glob(I + tag + '/*.jsonl'):
        for l in open(f):
            if l.startswith('{'):
                d = json.loads(l)
                if only and d['stage'] not in only: continue
                rows.setdefault((d['stage'], d['skill'], d['god']), []).append(d)


def mr(xs, f='{:.0f}'):
    if not xs: return '-'
    return (f + ' (md ' + f + ') [' + f + '–' + f + ']').format(S.mean(xs), S.median(xs), min(xs), max(xs))


def topsrc(rs, keys, n=3):
    agg = {}
    tot = 0
    for r in rs:
        for k in keys:
            for a, b in r['src'].get(k, {}).items():
                agg[a] = agg.get(a, 0) + b
                tot += b
    if not tot: return '-'
    return ', '.join(f"{a.replace('shot:proj.','').replace('area:','~')} {b/tot*100:.0f}%" for a, b in sorted(agg.items(), key=lambda x: -x[1])[:n])


out = {}
for st in ORDER:
    for (s, k, g), rs in sorted(rows.items(), key=lambda x: (x[0][2], -x[0][1])):
        if s != st: continue
        n = len(rs)
        if not g:
            t = [r['time'] for r in rs]
            early = sorted(x for x in t if x < 200)
            surv = sum(1 for r in rs if not r['dead'])
            line = f"{s:11} sk{k:<4} n{n:<3} surv {mr(t)} med {S.median(t):.0f} alive@end {surv} early<200 {early} lvl {S.mean([r['level'] for r in rs]):.0f} | pre5: {topsrc(rs, ['aw','aB'])} | all: {topsrc(rs, ['aw','aB','bw','bB','cw','cB'])}"
            print(line)
            out[(s, k, g)] = dict(surv=t)
        else:
            dts = [len(r['deaths']) for r in rs]
            d515 = [sum(1 for x in r['deaths'] if 300 <= x < 900) for r in rs]
            first = [r['deaths'][0] if r['deaths'] else r['time'] for r in rs]
            dpm05 = [sum(r['dpm'][0:5]) / 5 for r in rs]
            dpm515 = [sum(r['dpm'][5:15]) / 10 for r in rs]
            won = sum(1 for r in rs if r['won'])
            bs = {}
            for r in rs:
                for b in r['bosses']:
                    bs.setdefault(b['at'], []).append(b)
            bp = []
            for at in sorted(bs):
                bl = bs[at]
                ks = [b['kill'] for b in bl if b['kill'] is not None]
                bp.append(f"{bl[0]['id'][2:]}@{at//60} {('%.0f [%d–%d]' % (S.mean(ks), min(ks), max(ks))) if ks else 'none'} ({len(ks)}/{len(bl)}) hp{S.mean([b['hp'] for b in bl]):.0f}")
            bshare = []
            for r in rs:
                a = sum(r['src'].get('bB', {}).values()); b = sum(r['src'].get('bw', {}).values())
                if a + b: bshare.append(a / (a + b))
            print(f"{s:11} GOD n{n:<3} deaths {mr(dts, '{:.1f}')} d5-15 {mr(d515, '{:.1f}')} firstdeath {mr(first)} dpm0-5 {S.mean(dpm05):.0f} dpm5-15 {mr(dpm515)} won {won} lvl {S.mean([r['level'] for r in rs]):.0f} bossalive-share5-15 {S.mean(bshare)*100 if bshare else 0:.0f}%")
            print('      ', ' ; '.join(bp))
            if '--src' in sys.argv:
                print('       pre5:', topsrc(rs, ['aw', 'aB'], 4), '| 5-15 waves:', topsrc(rs, ['bw'], 4), '| 5-15 boss-alive:', topsrc(rs, ['bB'], 4))
