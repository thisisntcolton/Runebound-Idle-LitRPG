// GET /api/auth/login?provider=github|google  → redirect to the provider
import { getProvider, buildAuthorizeUrl } from '../_lib/providers.js';
import { appOrigin, encodeToken, oauthStateCookie, randomNonce } from '../_lib/session.js';
import { json } from '../_lib/db.js';

export function GET(request) {
  const url = new URL(request.url);
  const providerId = url.searchParams.get('provider');
  const provider = getProvider(providerId);

  if (!provider) {
    return json({ error: `Unknown or unconfigured provider: ${providerId}` }, 400);
  }

  try {
    const origin = appOrigin(request);
    const nonce = randomNonce();
    // provider travels inside the signed state so redirect_uri stays static
    // (Google rejects redirect URIs with query params).
    const state = encodeToken({ p: provider.id, n: nonce, iat: Math.floor(Date.now() / 1000) });

    const authorizeUrl = buildAuthorizeUrl(provider, {
      redirectUri: `${origin}/api/auth/callback`,
      state,
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: authorizeUrl,
        'Set-Cookie': oauthStateCookie(nonce),
        'cache-control': 'no-store',
      },
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
