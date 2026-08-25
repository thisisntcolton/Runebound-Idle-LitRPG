// POST /api/auth/logout  → clear session cookie
import { clearSessionCookie } from '../_lib/session.js';

function done() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'Set-Cookie': clearSessionCookie(),
    },
  });
}

export const POST = done;
export const GET = done;
