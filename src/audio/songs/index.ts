/** Registry of all music tracks. */
import type { MusicId } from '../audio';
import type { SongDef } from '../sequencer';
import { title } from './title';
import { menu } from './menu';
import { kitchen } from './kitchen';
import { trattoria } from './trattoria';
import { streets } from './streets';
import { foodcourt } from './foodcourt';
import { boss } from './boss';
import { finalboss } from './finalboss';
import { victory } from './victory';
import { gameover } from './gameover';

export const SONGS: Record<MusicId, SongDef> = {
  title,
  menu,
  kitchen,
  trattoria,
  streets,
  foodcourt,
  boss,
  finalboss,
  victory,
  gameover,
};
