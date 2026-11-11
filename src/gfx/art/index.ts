/** Imports every art module (they self-register sprites / stage envs). */
import './hero';
import './extra';
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
// Il Menù art (each file fills in its own sprites; see the contract in its header)
import './recipes_enemies_a';
import './recipes_enemies_b';
import './recipes_bosses_a';
import './recipes_bosses_b';
import './recipes_ingredients';
import './recipes_dishes';
// MUST stay last: stand-ins for every Il Menù sprite no module above has defined yet
import './placeholders';

export { STAGE_ENVS, registerStageEnv } from '../stageenv';
