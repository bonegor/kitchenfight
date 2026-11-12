#!/bin/bash
C=/tmp/claude-0/-home-user-kitchenfight/99284fd8-7f84-5a9c-a2f9-07af06a20ff0/scratchpad/recipes/work/integrate/check
D="pomodoro carbonara alfredo amatriciana margherita cacioepepe marinara ragu pesto vongole foodcourt"
date +%T
GOD=1 SECS=1500 POWERUPS='{"might":2,"maxhp":2,"armor":1,"recovery":1}' $C/batch.sh chk_god 12 1 $D
SECS=900 $C/batch.sh chk_a 12 1,0.6 $D
SECS=900 POWERUPS='{"might":2,"maxhp":2,"armor":1,"recovery":1}' $C/batch.sh chk_pu 12 1 $D
