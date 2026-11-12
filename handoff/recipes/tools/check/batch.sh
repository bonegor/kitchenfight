#!/bin/bash
# batch.sh <tag> <n> <skills> <dishes...>   (env: POWERUPS, GOD, SECS, PAR, PORT, CHAR)
C=/tmp/claude-0/-home-user-kitchenfight/99284fd8-7f84-5a9c-a2f9-07af06a20ff0/scratchpad/recipes/work/integrate/check
tag=$1; n=$2; skills=$3; shift 3
mkdir -p $C/sims/$tag
jobs=()
for d in "$@"; do
  left=$n; k=0
  while [ $left -gt 0 ]; do c=$(( left < ${CHUNK:-4} ? left : ${CHUNK:-4} )); jobs+=("$d $c $k"); left=$((left-c)); k=$((k+1)); done
done
printf '%s\n' "${jobs[@]}" | xargs -P ${PAR:-4} -L1 sh -c "PORT=${PORT:-5405} node $C/sim3.mjs \$0 ${CHAR:-enzo} ${SECS:-900} $skills \$1 '$tag' > $C/sims/$tag/\$0.\$2.jsonl 2>$C/sims/$tag/\$0.\$2.err"
echo DONE $tag $(date +%T)
