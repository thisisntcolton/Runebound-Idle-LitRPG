import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

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
    target: 'es2020'
  },
  server: {
    port: 5173,
    open: true
  }
});
