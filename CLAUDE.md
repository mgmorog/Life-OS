# Life OS — notes for Claude

One codebase, two places it runs:
- **Home-screen app (main)**: `node build.mjs --target pwa` → `dist-pwa/`, deployed by Vercel on every push to `main`. Backend is Supabase (see `supabase/schema.sql`) through `pwa/shim.js`, which provides the same `window.claude.use(...)` API the app uses on claude.ai.
- **claude.ai artifact (legacy)**: `node build.mjs --target artifact` (or `python3 build.py`) → `life-os.html`.

## Code
- `src/*.js` are concatenated in the order in `build.mjs` (`ORDER`) into one IIFE; `src/style.css` is the stylesheet. Top-level names are shared across files.
- `src/pwa.js` holds the home-screen-only hooks (`PWA.on` is false on claude.ai): reminder schedule, the .ics feed, extra Settings rows.
- `api/` are Vercel functions (`_lib.js` is shared). `api/mcp.js` is the Claude connector (remote MCP, tools over the `records` rows, logged as `claudelog`), `api/oauth.js` + `pwa/authorize.html` are its sign-in (OAuth 2.1 + PKCE, tokens stored hashed as `mcptoken`/`mcprt` records), and `api/_mcp.js` is their shared core. Keep the function count at 12 or fewer (Vercel Hobby). `pwa/` holds the shim, service worker, manifest, icons and pwa-only CSS.
- Design rules from the owner: light mode only (white/green), circles never ovals, calm premium motion. Don't ask the owner questions; pick sensible defaults and fix.

## Shipping a change
1. Edit `src/` (bump `APP_VER` and `WHATS_NEW` in `src/prefs.js` for anything visible).
2. `npm run test:pwa` (home-screen build against a local Supabase stand-in) and the Playwright scripts in `test/` for the app itself (`bash mk.sh` builds `test/page.html` first). Always run `npm run test:today` (Today layout: defaults, old pins, hide/show, reorder, until-done, one-line, six-card cap, module off, restore); add a case there for anything that changes Today.
3. Changed tokens? Run `npm run tokens`, then update the Life OS design system artifact (`daf29a28-6ee1-4dc0-94cd-1213160634bd`) with `design-system/tokens.json` and `design-system/README.md` as `project/tokens.json` and `project/README.md`, and its index last.
4. Commit and push to `main`. Vercel deploys; open apps reload on next open via `version.json`.

Secrets live only in Vercel environment variables. Never commit keys or put the service_role key in code.
