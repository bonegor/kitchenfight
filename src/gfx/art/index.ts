/** Imports every art module (they self-register sprites / stage envs). */
import './hero';
import './chefs';
import './enemies_a';
import './enemies_b';
import './bosses_a';
import './bosses_b';
import './items';
import './projectiles';
import './fx';
import './env_common';
import './env_kitchen';
import './env_trattoria';
import './env_streets';
import './env_foodcourt';

export { STAGE_ENVS, registerStageEnv } from '../stageenv';
