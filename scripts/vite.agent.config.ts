// Dev server for automated agents/tests: no HMR or live reload (pages never refresh mid-test),
// but file changes are still picked up on the next page load (unlike vite.nohmr.config.ts).
import { defineConfig } from 'vite';
export default defineConfig({ root: '.', server: { hmr: false } });
