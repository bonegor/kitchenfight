// Dev server for automated agents/tests: no HMR or live reload (pages never refresh mid-test),
// but file changes are still picked up on the next page load (unlike vite.nohmr.config.ts).
// A git worktree often links node_modules to the main checkout; Vite would refuse the font files
// behind that link (403), so the link's real folder is allowed too.
import { realpathSync } from 'fs';
import { defineConfig } from 'vite';

let modules = 'node_modules';
try {
  modules = realpathSync('node_modules');
} catch {
  /* no node_modules folder: nothing extra to allow */
}
export default defineConfig({ root: '.', server: { hmr: false, fs: { allow: ['.', modules] } } });
