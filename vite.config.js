import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Vercel exposes the commit it is building from; locally there is none, and
// "local" is a more honest answer than a stale SHA.
const commit = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || 'local';

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __BUILD_COMMIT__: JSON.stringify(commit),
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        hub: resolve(__dirname, 'index.html'),
        runebound: resolve(__dirname, 'runebound.html'),
        lifesim: resolve(__dirname, 'lifesim.html'),
        adventurersguild: resolve(__dirname, 'adventurersguild.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
