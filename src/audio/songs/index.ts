/** Registry of all music tracks. */
import type { MusicId } from '../audio';
import type { SongDef } from '../sequencer';
import { title } from './title';
import { menu } from './menu';
import { kitchen } from './kitchen';
import { trattoria } from './trattoria';
import { streets } from './streets';

export const SONGS: Partial<Record<MusicId, SongDef>> = {
  title,
  menu,
  kitchen,
  trattoria,
  streets,
};
