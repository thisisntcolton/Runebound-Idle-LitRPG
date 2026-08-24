// ============================================================
// OAuth 2.0 providers — GitHub & Google (authorization code flow)
// ============================================================

export const PROVIDERS = {
  github: {
    id: 'github',
    scope: 'read:user user:email',
    clientId: () => process.env.GITHUB_CLIENT_ID,
    clientSecret: () => process.env.GITHUB_CLIENT_SECRET,
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    async profile(accessToken) {
      const headers = {
        authorization: `Bearer ${accessToken}`,
        accept: 'application/vnd.github+json',
        'user-agent': 'runebound-idle',
      };
      const res = await fetch('https://api.github.com/user', { headers });
      if (!res.ok) throw new Error(`GitHub profile fetch failed (${res.status})`);
      const u = await res.json();
      return {
        providerId: String(u.id),
        displayName: u.name || u.login || `adventurer-${u.id}`,
        avatarUrl: u.avatar_url || null,
      };
    },
  },

  google: {
    id: 'google',
    scope: 'openid profile email',
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    extraAuthParams: { access_type: 'online', prompt: 'select_account' },
    async profile(accessToken) {
      const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Google profile fetch failed (${res.status})`);
      const u = await res.json();
      return {
        providerId: String(u.sub),
        displayName: u.name || u.email?.split('@')[0] || `adventurer-${u.sub.slice(-6)}`,
        avatarUrl: u.picture || null,
      };
    },
  },
};

export function getProvider(id) {
  const p = PROVIDERS[id];
  if (!p) return null;
  if (!p.clientId() || !p.clientSecret()) return null; // not configured
  return p;
}

export function configuredProviders() {
  return Object.keys(PROVIDERS).filter(id => getProvider(id));
}

export function buildAuthorizeUrl(provider, { redirectUri, state }) {
  const url = new URL(provider.authorizeUrl);
  url.searchParams.set('client_id', provider.clientId());
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', provider.scope);
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');
  for (const [k, v] of Object.entries(provider.extraAuthParams || {})) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

export async function exchangeCode(provider, { code, redirectUri }) {
  const res = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      client_id: provider.clientId(),
      client_secret: provider.clientSecret(),
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Token exchange failed: ${data.error_description || data.error || res.status}`);
  }
  return data.access_token;
}
