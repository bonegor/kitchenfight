/**
 * Credits for the soundtrack: the public-domain pieces it arranges (src/audio/songs/*, documented with
 * their reference transcriptions in docs/music/*.md) and the recorded instrument samples it plays
 * (src/audio/assets/inst, sources and licenses in docs/credits/music-samples.md).
 */

export interface PieceCredit {
  /** where the game plays it */
  where: string;
  piece: string;
  composer: string;
  year: number;
}

export const MUSIC_PIECES: readonly PieceCredit[] = [
  { where: 'Title', piece: 'Funiculì, Funiculà', composer: 'Luigi Denza', year: 1880 },
  { where: 'Menus', piece: "'O sole mio", composer: 'Eduardo di Capua', year: 1898 },
  { where: 'La Cucina', piece: 'Anvil Chorus (Il trovatore)', composer: 'Giuseppe Verdi', year: 1853 },
  { where: 'La Trattoria', piece: "Brindisi “Libiamo ne' lieti calici” (La traviata)", composer: 'Giuseppe Verdi', year: 1853 },
  { where: 'I Vicoli di Napoli', piece: 'La Danza, with the traditional Tarantella Napoletana', composer: 'Gioachino Rossini', year: 1835 },
  { where: 'La Food Court', piece: 'Torna a Surriento', composer: 'Ernesto De Curtis', year: 1902 },
  { where: 'Bosses', piece: 'Galop from the William Tell Overture', composer: 'Gioachino Rossini', year: 1829 },
  { where: 'Final boss', piece: 'Dies irae (Messa da Requiem)', composer: 'Giuseppe Verdi', year: 1874 },
  { where: 'Victory', piece: 'Triumphal March (Aida)', composer: 'Giuseppe Verdi', year: 1871 },
  { where: 'Game over', piece: '“Vesti la giubba” (Pagliacci)', composer: 'Ruggero Leoncavallo', year: 1892 },
];

/** Attribution for the recorded instruments (required by CC BY-SA 3.0 and CC Sampling Plus 1.0). */
export const INSTRUMENT_CREDITS: readonly string[] = [
  'Accordion: “Button Accordion HN”, FreePats project (Hohner accordion recorded by Jeff Stauffer; bank by michael02022), CC0 1.0.',
  "Mandolin: “Terkelsen's Mandolin” by Lars Terkelsen, SFZ conversion by S. Christian Collins (https://github.com/sfzinstruments/terkelsen.mandolin; license not stated, credited).",
  'Piano, nylon and steel guitar: “Meta Open Sound” by Meta (Creative Audio team), CC0 1.0.',
  'Orchestra (strings, brass, woodwinds, chorus, harp, mallets, timpani, tam-tam): “Sonatina Symphonic Orchestra” by Mattias Westlund and Peter Eastman (https://github.com/peastman/sso), CC Sampling Plus 1.0 (https://creativecommons.org/licenses/sampling+/1.0/); horn section sustains by Mattias Westlund, CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/); pipe organ “St. Stephen\'s Anglican” recorded by Nicholas Appleton, CC Sampling Plus 1.0; celesta by stamperadam (freesound.org), CC0 1.0.',
  'Harpsichord and percussion (tambourine, snare, cymbals, bass drums, triangle, shaker, brake drum, anvil, slapstick, woodblock, vibraslap, flexatone, claves, ratchet, toy whistle): “Versilian Community Sample Library” by Versilian Studios, CC0 1.0.',
  'Castanets: “World Percussion”, FreePats project, CC0 1.0.',
  'Orchestra hit: “Musyng Kite” soundfont via midi-js-soundfonts (Benjamin Gleitzman), CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/).',
  'All samples are edited (trimmed, pitched, looped, level-matched and re-encoded as MP3). The files under CC BY-SA 3.0 are shared under the same license.',
];
