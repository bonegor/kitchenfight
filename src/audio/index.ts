/** Plugs the audio engine (recorded samples with synthesized fallbacks) into the game's audio API (import once at startup). */
import { installAudio } from './audio';
import { AudioEngine } from './engine';

installAudio(new AudioEngine());
