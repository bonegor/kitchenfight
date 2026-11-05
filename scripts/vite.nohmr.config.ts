// Dev server without HMR/live-reload (for automated playtests while files change).
import { defineConfig } from 'vite';
export default defineConfig({ root: '.', server: { hmr: false, watch: { ignored: ['**/*'] } } });
