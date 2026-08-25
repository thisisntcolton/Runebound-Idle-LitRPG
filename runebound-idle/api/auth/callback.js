// GET /api/auth/callback?code=...&state=...  → exchange, upsert user, set session
import { getProvider, exchangeCode } from '../_lib/providers.js';
import { appOrigin, decodeToken, getOauthNonce, sessionCookie,
         clearOauthStateCookie } from '../_lib/session.js';
import { db, ensureSchema } from '../_lib/db.js';

function fail(origin, reason) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/?auth_error=${encodeURIComponent(reason)}`,
      'Set-Cookie': clearOauthStateCookie(),
      'cache-control': 'no-store',
    },
  });
}

export async function GET(request) {
  const url = new URL(request.url);
  const origin = appOrigin(request);

  const oauthError = url.searchParams.get('error');
  if (oauthError) return fail(origin, oauthError);

  const code = url.searchParams.get('code');
  const stateToken = url.searchParams.get('state');
  if (!code || !stateToken) return fail(origin, 'missing_code_or_state');

  // Verify signed state + CSRF nonce cookie
  const state = decodeToken(stateToken, 600);
  if (!state) return fail(origin, 'bad_state');
  const cookieNonce = getOauthNonce(request);
  if (!cookieNonce || cookieNonce !== state.n) return fail(origin, 'state_mismatch');

  const provider = getProvider(state.p);
  if (!provider) return fail(origin, 'unconfigured_provider');

  try {
    const accessToken = await exchangeCode(provider, {
      code,
      redirectUri: `${origin}/api/auth/callback`,
    });
    const profile = await provider.profile(accessToken);
    const userId = `${provider.id}:${profile.providerId}`;

    await ensureSchema();
    const sql = db();
    await sql`
      INSERT INTO users (id, provider, provider_id, display_name, avatar_url, last_seen)
      VALUES (${userId}, ${provider.id}, ${profile.providerId},
              ${profile.displayName}, ${profile.avatarUrl}, now())
      ON CONFLICT (id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            avatar_url   = EXCLUDED.avatar_url,
            last_seen    = now()`;

    const headers = new Headers({ Location: `${origin}/?signed_in=1`, 'cache-control': 'no-store' });
    headers.append('Set-Cookie', sessionCookie({ id: userId }));
    headers.append('Set-Cookie', clearOauthStateCookie());
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error('[auth/callback]', err);
    return fail(origin, 'auth_failed');
  }
}
