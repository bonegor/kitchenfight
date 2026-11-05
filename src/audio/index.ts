/** Plugs the synthesized audio engine into the game's audio API (import once at startup). */
import { installAudio } from './audio';
import { AudioEngine } from './engine';

installAudio(new AudioEngine());
