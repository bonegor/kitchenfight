#!/bin/bash
# batch.sh <tag> <n> <skills> <dishes...>   (POWERUPS env passes through; PU label = $PUL)
W=/tmp/claude-0/-home-user-kitchenfight/99284fd8-7f84-5a9c-a2f9-07af06a20ff0/scratchpad/recipes/work/balance
tag=$1; n=$2; skills=$3; shift 3
mkdir -p $W/sims/$tag
for d in "$@"; do echo $d; done | xargs -P ${PAR:-3} -I{} sh -c "PORT=5381 node $W/sim2.mjs {} ${CHAR:-enzo} ${SECS:-900} $skills $n '$PUL' > $W/sims/$tag/{}.jsonl 2>$W/sims/$tag/{}.err"
echo DONE $tag
