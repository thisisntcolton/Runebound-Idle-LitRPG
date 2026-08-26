// ============================================================
// BUILD STAMP
//
// This file exists because of a question that should have been trivial and
// wasn't: "which version is actually live?" The app rendered no version
// anywhere, so the only way to answer it was to squint at the Vercel
// dashboard and trust that the commit it named was the commit that built.
//
// Now the running page says what it is. Vite substitutes these three
// constants at build time; the `typeof` guards are there because the test
// harness imports these modules directly under Node, where Vite's define
// pass never ran and a bare `__APP_VERSION__` would throw.
//
// The same three values are served by /api/version, which is a Function
// rather than a static asset — so if the two ever disagree, you have
// learned something specific: the static build and the serverless
// functions came from different commits.
// ============================================================

/** package.json version at the moment the bundle was built. */
export const VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

/** ISO timestamp of the build itself. */
export const BUILT_AT =
  typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null;

/** Short commit SHA, when the builder knew one (Vercel sets this). */
export const COMMIT =
  typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : 'local';

/** One line, for the top bar: `v1.5.0 · a1b2c3d · 26 Aug`. */
export function buildLabel() {
  const bits = [`v${VERSION}`];
  if (COMMIT && COMMIT !== 'local') bits.push(COMMIT);
  if (BUILT_AT) {
    const d = new Date(BUILT_AT);
    if (!Number.isNaN(d.getTime())) {
      bits.push(d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));
    }
  }
  return bits.join(' · ');
}

/** Everything, for the console and for /api/version to be compared against. */
export function buildInfo() {
  return { version: VERSION, commit: COMMIT, builtAt: BUILT_AT };
}
