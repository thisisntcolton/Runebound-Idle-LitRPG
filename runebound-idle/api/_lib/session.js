// ============================================================
// Stateless sessions: HMAC-signed cookies (no session table needed)
// ============================================================
import crypto from 'node:crypto';

const SESSION_COOKIE = 'rb_session';
const STATE_COOKIE = 'rb_oauth';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET is missing or too short (need 16+ chars).');
  }
  return s;
}

const b64url = buf => Buffer.from(buf).toString('base64url');
const unb64url = str => Buffer.from(str, 'base64url').toString('utf8');

function sign(payloadStr) {
  return crypto.createHmac('sha256', secret()).update(payloadStr).digest('base64url');
}

export function encodeToken(payload) {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function decodeToken(token, maxAgeSeconds = MAX_AGE) {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  // timing-safe compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(unb64url(body)); } catch { return null; }
  if (!payload?.iat || (Date.now() / 1000) - payload.iat > maxAgeSeconds) return null;
  return payload;
}

// ---------- cookies ----------
export function parseCookies(request) {
  const header = request.headers.get('cookie') || '';
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function cookieString(name, value, { maxAge = MAX_AGE, clear = false } = {}) {
  const parts = [
    `${name}=${clear ? '' : encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${clear ? 0 : maxAge}`,
  ];
  // Secure everywhere except plain-http localhost dev
  if (process.env.VERCEL_ENV !== 'development' && process.env.NODE_ENV !== 'development') {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function sessionCookie(user) {
  return cookieString(SESSION_COOKIE, encodeToken({ uid: user.id, iat: Math.floor(Date.now() / 1000) }));
}
export function clearSessionCookie() {
  return cookieString(SESSION_COOKIE, '', { clear: true });
}
export function oauthStateCookie(nonce) {
  return cookieString(STATE_COOKIE, nonce, { maxAge: 600 });
}
export function clearOauthStateCookie() {
  return cookieString(STATE_COOKIE, '', { clear: true });
}

export function getSession(request) {
  const token = parseCookies(request)[SESSION_COOKIE];
  const payload = decodeToken(token);
  return payload?.uid ? { userId: payload.uid } : null;
}

export function getOauthNonce(request) {
  return parseCookies(request)[STATE_COOKIE] || null;
}

export function randomNonce() {
  return crypto.randomBytes(24).toString('base64url');
}

// ---------- origin ----------
// Prefer an explicit APP_URL so OAuth redirect_uri is stable and unspoofable.
export function appOrigin(request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  return `${proto}://${host}`;
}
