// ============================================================
// Local stand-in for `vercel dev`: serves dist/ and mounts the
// real /api handlers. Used by the full-stack browser test.
// Run: node --import ./test/register.mjs test/dev-server.mjs
// ============================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const PORT = Number(process.env.PORT || 4180);

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png',
};

const ROUTES = {
  '/api/me': '../api/me.js',
  '/api/save': '../api/save.js',
  '/api/leaderboard': '../api/leaderboard.js',
  '/api/auth/login': '../api/auth/login.js',
  '/api/auth/callback': '../api/auth/callback.js',
  '/api/auth/logout': '../api/auth/logout.js',
};

async function toWebRequest(req) {
  const url = `http://localhost:${PORT}${req.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach(x => headers.append(k, x));
    else if (v !== undefined) headers.set(k, v);
  }
  let body;
  if (!['GET', 'HEAD'].includes(req.method)) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    body = Buffer.concat(chunks);
  }
  return new Request(url, { method: req.method, headers, body });
}

async function sendWebResponse(res, webRes) {
  const headers = {};
  const setCookies = webRes.headers.getSetCookie?.() || [];
  webRes.headers.forEach((v, k) => { if (k.toLowerCase() !== 'set-cookie') headers[k] = v; });
  res.writeHead(webRes.status, { ...headers, ...(setCookies.length ? { 'Set-Cookie': setCookies } : {}) });
  const buf = Buffer.from(await webRes.arrayBuffer());
  res.end(buf);
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://localhost:${PORT}`).pathname;

  if (ROUTES[pathname]) {
    try {
      const mod = await import(ROUTES[pathname]);
      const handler = mod[req.method] || mod.default?.fetch;
      if (!handler) { res.writeHead(405).end('Method Not Allowed'); return; }
      const webRes = await handler(await toWebRequest(req));
      await sendWebResponse(res, webRes);
    } catch (err) {
      console.error('[api error]', pathname, err);
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: String(err.message) }));
    }
    return;
  }

  if (pathname.startsWith('/api/')) {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
    return;
  }

  // static
  let file = path.join(dist, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => console.log(`dev-server on http://localhost:${PORT}`));
