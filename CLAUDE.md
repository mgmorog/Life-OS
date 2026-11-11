# Life OS — notes for Claude

One codebase, two places it runs:
- **Home-screen app (main)**: `node build.mjs --target pwa` → `dist-pwa/`, deployed by Vercel on every push to `main`. Backend is Supabase (see `supabase/schema.sql`) through `pwa/shim.js`, which provides the same `window.claude.use(...)` API the app uses on claude.ai.
- **claude.ai artifact (legacy)**: `node build.mjs --target artifact` (or `python3 build.py`) → `life-os.html`.

## Code
- `src/*.js` are concatenated in the order in `build.mjs` (`ORDER`) into one IIFE; `src/style.css` is the stylesheet. Top-level names are shared across files.
- `src/pwa.js` holds the home-screen-only hooks (`PWA.on` is false on claude.ai): reminder schedule, the .ics feed, extra Settings rows.
- `api/` are Vercel functions (`_lib.js` is shared). `pwa/` holds the shim, service worker, manifest, icons and pwa-only CSS.
- Design rules from the owner: light mode only (white/green), circles never ovals, calm premium motion. Don't ask the owner questions; pick sensible defaults and fix.

## Shipping a change
1. Edit `src/` (bump `APP_VER` and `WHATS_NEW` in `src/prefs.js` for anything visible).
2. `npm run test:pwa` (home-screen build against a local Supabase stand-in) and the Playwright scripts in `test/` for the app itself (`bash mk.sh` builds `test/page.html` first).
3. Commit and push to `main`. Vercel deploys; open apps reload on next open via `version.json`.

Secrets live only in Vercel environment variables. Never commit keys or put the service_role key in code.
