/** Registry of all music tracks. */
import type { MusicId } from '../audio';
import type { SongDef } from '../sequencer';
import { title } from './title';
import { menu } from './menu';

export const SONGS: Partial<Record<MusicId, SongDef>> = {
  title,
  menu,
};
