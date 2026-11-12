import json, statistics as S
W = '/tmp/claude-0/-home-user-kitchenfight/99284fd8-7f84-5a9c-a2f9-07af06a20ff0/scratchpad/recipes/work/balance/sims/'
SRC = {'pomodoro': 'fin', 'carbonara': 'fin4', 'alfredo': 'fin4', 'amatriciana': 'fin4', 'cacioepepe': 'fin3', 'margherita': 'fin2',
       'marinara': 'fin3', 'ragu': 'fin3', 'pesto': 'fin3', 'vongole': 'fin3', 'foodcourt': 'fin4'}
GOD = {d: ('godf2' if d in ('cacioepepe', 'marinara', 'ragu', 'pesto', 'vongole') else 'godf3') for d in SRC}
TIER = {'pomodoro': 'T1', 'carbonara': 'T2', 'alfredo': 'T3', 'amatriciana': 'T3', 'margherita': 'T3', 'cacioepepe': 'T4', 'marinara': 'T4', 'ragu': 'T5', 'pesto': 'T5', 'vongole': 'T5', 'foodcourt': 'T6'}
def load(tag, d):
    return [json.loads(l) for l in open(W + tag + '/' + d + '.jsonl') if l.startswith('{')]
def ms(v):
    return f"{S.mean(v):.0f} [{min(v)}–{max(v)}]"
bench = {}
for l in open(W + 'benchf.jsonl'):
    x = json.loads(l); bench.setdefault((x['dish'], x['slot']), []).append(x)
print('| # | dish | tier | no-PU sk1 | no-PU sk0.6 | mid pantry sk1 (5:00 boss kills) | god+pantry deaths | boss kill s (natural bot, god+pantry) 5:00 / 10:00 / 15:00 | bench TTK s (fixed build) |')
for i, d in enumerate(SRC):
    rs = load(SRC[d], d)
    a = [r['time'] for r in rs if r['skill'] == 1]
    b = [r['time'] for r in rs if r['skill'] == 0.6]
    wa = sum(1 for r in rs if r['skill'] == 1 and r['time'] >= 900)
    wb = sum(1 for r in rs if r['skill'] == 0.6 and r['time'] >= 900)
    pu = load('puf', d)
    p = [r['time'] for r in pu]
    k5 = [bb for r in pu for bb in r['bosses'] if bb['at'] == 300]
    k5s = f"{sum(1 for bb in k5 if bb['kill'] is not None)}/{len(pu)}"
    g = load(GOD[d], d)
    deaths = S.mean(len(r['deaths']) for r in g)
    kills = []
    for at in (300, 600, 900):
        bl = [bb for r in g for bb in r['bosses'] if bb['at'] == at]
        ks = [bb['kill'] for bb in bl if bb['kill'] is not None]
        kills.append(f"{bl[0]['id'][2:]} {S.mean(ks):.0f}" + (f" ({len(ks)}/{len(bl)})" if len(ks) < len(bl) else '') if ks else f"{bl[0]['id'][2:]} –")
    bt = ' / '.join(f"{S.mean([x['ttk'] or 600 for x in bench[(d, s)]]):.0f}" for s in range(3))
    print(f"| {i+1} | {d} | {TIER[d]} | {ms(a)} w{wa}/{len(a)} | {ms(b)} w{wb}/{len(b)} | {ms(p)} ({k5s}) | {deaths:.1f} | {' / '.join(kills)} | {bt} |")
