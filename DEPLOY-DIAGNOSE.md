# "Vercel still says v1.3" — how to find out why

I can't see your machine or your Vercel project from here, so this is the
short path to the answer rather than a general troubleshooting essay.

What I *can* tell you already: **the v1.5 code is not the problem.** I did a
clean-room check in an empty directory — `npm ci` from the committed
lockfile, then `npm run build` — and it builds. Every file under `api/`
imports and resolves cleanly under Node 20+. So if Vercel is serving v1.3,
the v1.5 commit did not reach the branch Vercel builds.

---

## Step 1 — run this in your repo

Paste the whole block into a terminal **inside your local repo folder**. It
answers every question below at once and changes nothing.

```bash
echo "── branch ─────────────";  git branch --show-current
echo "── last 5 commits ─────";  git log --oneline -5
echo "── uncommitted ────────";  git status --short
echo "── remote ─────────────";  git remote -v
echo "── local vs remote ────";  git fetch -q && git status -sb | head -1
echo "── version on disk ────";  grep '"version"' package.json
echo "── version on remote ──";  git show origin/$(git branch --show-current):package.json 2>/dev/null | grep '"version"'
echo "── repo root files ────";  ls
```

Send me the output and I'll tell you exactly which of the four it is.

## Step 2 — what each answer means

**`git status --short` lists a pile of modified files.**
The likely one. Extracting the zip changed the files but nothing committed
them; `git push` then had nothing to push and said `Everything up-to-date`.

```bash
git add -A && git commit -m "v1.5" && git push
```

**`version on disk` says 1.5.0 but `version on remote` says 1.3.x.**
Same conclusion as above, stated from the other end — the commit isn't on
the remote.

**`branch` isn't the branch Vercel deploys.**
Vercel builds one Production Branch (Project → Settings → Git). A push to
any other branch produces a *Preview* deployment on a different URL and
leaves production untouched — which looks exactly like "nothing happened."
Either push to that branch or change the setting to match.

**`ls` shows a `runebound-idle/` or `runebound-v1.5/` folder inside the repo root.**
The zip extracted a level too deep, so the real files sit in a subfolder and
the root is still v1.3. Move the contents up one level and re-commit.

**Everything looks right and the remote genuinely has v1.5.**
Then it's on Vercel's side. Open the project → **Deployments**. You are
looking for one of three things:

- A deployment for the v1.5 commit marked **Error** — open it and read the
  build log. Vercel keeps serving the last *successful* deployment, so a
  failed build presents as the old version still being live.
- **No deployment at all** for that commit — the Git integration is
  disconnected or the repo isn't the one linked (Settings → Git).
- A **Ready** deployment for v1.5 that isn't marked *Current* — promote it
  (⋯ → Promote to Production). This happens after a manual rollback.

---

## Step 3 — so this is never ambiguous again

v1.5 now prints its own build under the "an idle LitRPG" line in the top
bar: `v1.5.0 · a1b2c3d · 26 Aug` — version, the commit Vercel built from,
and the build date. There's also `window.__RUNEBOUND_BUILD__` in the
console.

And `https://YOUR-DOMAIN.vercel.app/api/version` reports the same three
values from the *serverless* side, live:

```json
{ "version": "1.5.0", "commit": "a1b2c3d", "branch": "main",
  "target": "production", "deploymentId": "dpl_...", ... }
```

Two independent readings, which makes the diagnosis mechanical:

| Top bar | `/api/version` | What it means |
|---|---|---|
| v1.5 | v1.5, same commit | Deployed correctly. |
| v1.3 | v1.3 | The commit never arrived. Step 1. |
| v1.3 | v1.5 | Your browser cached the old bundle — hard-reload (Ctrl+Shift+R). |
| v1.5 | 404 | The Functions didn't deploy; check the build log. |

Note the browser-cache row: `index.html` is served `no-store` by Vercel and
the JS bundle is content-hashed, so this *shouldn't* happen — but a hard
reload costs nothing and rules it out in five seconds.
