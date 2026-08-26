// GET /api/version → what the serverless side thinks it is.
//
// The static bundle carries its own stamp (src/core/build.js) baked in at
// build time. This one is read live, from the Function's environment. If
// the two disagree, the deployment is half-old: Vercel served a cached or
// partial build, and that is worth knowing without guessing.
//
// Deliberately unauthenticated and deliberately dull — it exposes nothing
// that isn't already public in the bundle or the repo.

const VERSION = '1.5.1'; // kept in step with package.json by test/content.test.mjs

export function GET() {
  const env = process.env;
  return new Response(JSON.stringify({
    version: VERSION,
    commit: (env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || null,
    branch: env.VERCEL_GIT_COMMIT_REF || null,
    message: env.VERCEL_GIT_COMMIT_MESSAGE || null,
    target: env.VERCEL_ENV || 'unknown',
    deploymentId: env.VERCEL_DEPLOYMENT_ID || null,
    region: env.VERCEL_REGION || null,
    now: new Date().toISOString(),
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
