import json, sys, os, glob, statistics as S
# summ.py <tag> [--bosses] [--dmg]
W = '/tmp/claude-0/-home-user-kitchenfight/99284fd8-7f84-5a9c-a2f9-07af06a20ff0/scratchpad/recipes/work/balance/sims/'
tag = sys.argv[1]
ORDER = ['kitchen', 'trattoria', 'streets', 'pomodoro', 'carbonara', 'alfredo', 'amatriciana', 'cacioepepe', 'margherita', 'marinara', 'ragu', 'pesto', 'vongole', 'foodcourt']
rows = {}
for f in glob.glob(W + tag + '/*.jsonl'):
    for line in open(f):
        line = line.strip()
        if not line.startswith('{'): continue
        d = json.loads(line)
        rows.setdefault((d['stage'], d['skill']), []).append(d)
def fmt(v):
    return f"{S.mean(v):.0f} [{min(v)}-{max(v)}]"
for st in ORDER:
    for (s, k), rs in sorted(rows.items(), key=lambda x: -x[0][1]):
        if s != st: continue
        times = [r['time'] for r in rs]
        wins = sum(1 for r in rs if r['time'] >= 900 and not r['dead'])
        line = f"{s:12} sk{k:<4} n{len(rs)} {fmt(times):>18} win {wins}/{len(rs)}"
        if rs[0].get('god'):
            ds = [len(r['deaths']) for r in rs]
            fd = [r['deaths'][0] if r['deaths'] else 1200 for r in rs]
            d5 = [sum(1 for x in r['deaths'] if x < 300) for r in rs]
            d10 = [sum(1 for x in r['deaths'] if 300 <= x < 600) for r in rs]
            d15 = [sum(1 for x in r['deaths'] if 600 <= x < 900) for r in rs]
            line = f"{s:12} sk{k:<4} n{len(rs)} deaths {S.mean(ds):.1f} (0-5m {S.mean(d5):.1f}, 5-10m {S.mean(d10):.1f}, 10-15m {S.mean(d15):.1f}) first {S.mean(fd):.0f} [{min(fd)}-{max(fd)}] won {sum(1 for r in rs if r['won'])}/{len(rs)}"
        if '--bosses' in sys.argv:
            bs = {}
            for r in rs:
                for b in r['bosses']:
                    bs.setdefault(b['at'], []).append(b)
            parts = []
            for at in sorted(bs):
                bl = bs[at]
                ks = [b['kill'] for b in bl if b['kill'] is not None]
                parts.append(f"{bl[0]['id']}@{at}: hp~{S.mean([b['hp'] for b in bl]):.0f} kill {len(ks)}/{len(bl)} " + (f"{S.mean(ks):.0f}s[{min(ks)}-{max(ks)}]" if ks else '') + f" dmg {S.mean([b.get('dmg') or 0 for b in bl]):.0f}")
            line += ' | ' + ' ; '.join(parts)
        if '--dmg' in sys.argv:
            agg = {}
            for r in rs:
                for k2, v in r['top']: agg[k2] = agg.get(k2, 0) + v / len(rs)
            line += ' | ' + ', '.join(f"{k2} {v:.0f}" for k2, v in sorted(agg.items(), key=lambda x: -x[1])[:6])
        print(line)
