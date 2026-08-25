# Deploying Runebound to Vercel + Neon

Roughly 20 minutes. There's one ordering quirk: **OAuth apps need your deployed URL**, so you
deploy first, then wire up sign-in, then redeploy. Steps below are in the order that works.

---

## 1. Push to GitHub

```bash
cd runebound-idle
git init
git add .
git commit -m "Runebound: idle LitRPG with cloud saves and leaderboards"
gh repo create runebound-idle --private --source=. --push
# no gh CLI? create the repo on github.com, then:
#   git remote add origin git@github.com:<you>/runebound-idle.git && git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `dist/`, `.vercel/`, and every `.env*` file.
**Never commit real secrets** — only `.env.example` belongs in git.

---

## 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
2. Vercel auto-detects **Vite** (`vercel.json` pins it anyway: build `npm run build`, output `dist`).
3. Click **Deploy**.

The game will be live and fully playable immediately — it just runs in local-save-only mode until
the database and OAuth are configured. Note your production URL, e.g.
`https://runebound-idle.vercel.app`. That's your `APP_URL`.

---

## 3. Attach the database (Neon)

1. In your project → **Storage** → **Create Database** → **Neon** (Postgres).
2. Pick a region near your users and connect it to the project.
3. Vercel injects `DATABASE_URL` (plus `DATABASE_URL_UNPOOLED`, `PG*`, and legacy `POSTGRES_*`)
   into every environment automatically. You don't need to copy anything.

**Tables are created automatically** on the first API request (`ensureSchema()` in
`api/_lib/db.js` runs `CREATE TABLE IF NOT EXISTS`). No migration step, no SQL to paste.

---

## 4. Create the OAuth apps

You can configure GitHub, Google, or both — sign-in buttons only render for providers that have
**both** an ID and a secret set. Everything below uses one callback URL:

```
https://YOUR-DOMAIN.vercel.app/api/auth/callback
```

### GitHub

1. [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. **Homepage URL**: `https://YOUR-DOMAIN.vercel.app`
3. **Authorization callback URL**: `https://YOUR-DOMAIN.vercel.app/api/auth/callback`
4. Register, then **Generate a new client secret**. Copy both values.

### Google

1. [console.cloud.google.com](https://console.cloud.google.com) → create/select a project
2. **APIs & Services → OAuth consent screen** → External → fill in app name + support email.
   While the app is in "Testing", only accounts you add as test users can sign in — hit
   **Publish app** when you want it open to everyone.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `https://YOUR-DOMAIN.vercel.app`
   - **Authorized redirect URIs**: `https://YOUR-DOMAIN.vercel.app/api/auth/callback`
4. Copy the client ID and secret.

> Google rejects redirect URIs containing query strings, which is why the provider travels inside
> the signed `state` parameter rather than the URL. Don't "helpfully" add `?provider=google`.

---

## 5. Set environment variables

Project → **Settings** → **Environment Variables**. Add these for **Production** (and Preview if
you want sign-in on preview deploys):

| Variable | Value |
|---|---|
| `SESSION_SECRET` | 32+ random bytes — `openssl rand -base64 32` |
| `APP_URL` | `https://YOUR-DOMAIN.vercel.app` (no trailing slash) |
| `GITHUB_CLIENT_ID` | from step 4 |
| `GITHUB_CLIENT_SECRET` | from step 4 |
| `GOOGLE_CLIENT_ID` | from step 4 |
| `GOOGLE_CLIENT_SECRET` | from step 4 |

`DATABASE_URL` is already there from step 3.

Then **Deployments → ⋯ → Redeploy** so the new variables take effect.

> Changing `SESSION_SECRET` later invalidates every session and signs all players out. Their
> saves are safe in the database — they just sign in again.

### Preview deployments

Preview URLs are randomly generated, so OAuth won't match a fixed callback. Either skip sign-in on
previews (the game still runs — it just shows "cloud sync unavailable"), or set `APP_URL` per
preview branch and register that URL with your OAuth apps.

---

## 6. Verify

Open your production URL and check:

- **Settings → Account** shows "Sign in with GitHub / Google"
- Signing in redirects back with your name and avatar on the account card
- **Sync now** stamps a "Last synced" time
- **Leaderboard** lists you after the first sync
- Open the site in a private window, sign in with the same account → your progress follows you

If sign-in bounces back with `?auth_error=…`, check **Deployments → Functions logs**. Common causes:
`auth_failed` (client secret wrong), `state_mismatch` (cookies blocked, or `APP_URL` doesn't match
the browser's URL), `unconfigured_provider` (env var missing or not redeployed).

---

## Local development

**Frontend only** — instant, no backend, local saves:

```bash
npm install
npm run dev            # http://localhost:5173
```

**Full stack** with working API, database, and sign-in:

```bash
npm i -g vercel
vercel link
vercel env pull .env.local   # pulls DATABASE_URL and the rest
npm run dev:full             # vercel dev → http://localhost:3000
```

For sign-in to work locally, set `APP_URL=http://localhost:3000` in `.env.local` and add
`http://localhost:3000/api/auth/callback` as a callback URL on your OAuth apps (GitHub allows
multiple apps — a separate "Runebound (dev)" app is tidier than editing the production one).

---

## Running the API tests

The test suite runs the real handlers against a real Postgres, with the Neon driver aliased to a
`pg`-backed shim (`test/loader.mjs`; `pg` is a devDependency, so `npm install` covers it). It covers save validation, session signing, OAuth state/CSRF
handling, save round-trips, throttling, and leaderboard ranking.

```bash
# point at any Postgres you like:
DATABASE_URL="postgresql://postgres@localhost:5432/runebound" \
SESSION_SECRET="anything-at-least-16-chars-long" \
APP_URL="http://localhost:3000" \
GITHUB_CLIENT_ID=x GITHUB_CLIENT_SECRET=x \
GOOGLE_CLIENT_ID=x GOOGLE_CLIENT_SECRET=x \
npm run test:api
```

`test/dev-server.mjs` serves `dist/` with the real API mounted, if you want to exercise the client
against live endpoints without the Vercel CLI.

---

## Architecture notes

**Auth** is hand-rolled OAuth 2.0 (authorization code flow) with **stateless sessions**: an
HMAC-SHA256-signed cookie, no session table, no auth dependency. CSRF is covered by a signed
`state` token cross-checked against a short-lived nonce cookie.

**Saves** are a single JSONB blob per user. On sign-in the client reconciles local vs cloud: a
blank device silently adopts the cloud save, a clearly-ahead local pushes, and genuine divergence
asks the player which timeline is real. Cloud saves are run through the same field-migration as
local ones, so an older save never crashes a newer build. Writes are throttled to one per 10s per
user; the client syncs every 60s and on tab-hide.

**Leaderboard integrity.** Rankings are never taken from client-claimed fields. `api/_lib/validate.js`
recomputes total level and combat level from the save's raw XP using the same curve the game uses
(`src/core/xp.js`, imported directly — one source of truth), clamps negative/`NaN`/`Infinity`/absurd
values, and caps the payload at 512 KB. Board names come from a fixed allowlist and every query is
parameterized.

This is structural sanity-checking, **not** real anti-cheat: the game simulates locally, so a
determined player can still edit their own save. Closing that gap means moving simulation
server-side (or at least validating progress rate against elapsed time) — a much larger change,
and rarely worth it for an idle game. If the leaderboard ever needs to be authoritative, that's
the direction.
