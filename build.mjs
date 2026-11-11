// Builds Life OS from src/ for two targets:
//   --target artifact  → life-os.html, the single page published on claude.ai (unchanged from before)
//   --target pwa       → dist-pwa/, the installable home-screen app (Vercel serves this folder)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { transform, build } from 'esbuild';

const root = new URL('.', import.meta.url).pathname;
const target = (process.argv.find(a => a.startsWith('--target=')) || '').split('=')[1] || process.argv[process.argv.indexOf('--target') + 1] || 'artifact';
const minify = process.env.NOMIN !== '1';
export const ORDER = ['core', 'sheets', 'capture', 'today', 'calendar', 'studio', 'more', 'modules', 'organize', 'assist', 'hubs', 'tools', 'tools2', 'prep', 'onboard', 'focus', 'plan', 'mods', 'mods2', 'mods3', 'pwa', 'dash', 'travel', 'prefs', 'main'];

const read = p => readFileSync(root + p, 'utf8');
const css0 = read('src/style.css');
const js0 = ORDER.map(n => read(`src/${n}.js`) + '\n').join('');
const wrapped = `(()=>{\n${js0}\nwindow.__lifeos={App,recs,get,store,dayItems,put,create,remove,todayK,toolOf,hubHidden};\n})();\n`;
const FONTS = 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Figtree:wght@400;500;600;700&display=swap';
const BODY = `<div class="mini" id="mini" aria-hidden="true"></div>
<main id="view"></main>
<div class="commitbar" id="commitbar" role="region" aria-label="Plan actions" hidden></div>
<nav class="nav" aria-label="Main"><div class="in" id="nav-in"></div></nav>
<div id="layers"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;

const mini = async (code, loader) => minify ? (await transform(code, { loader, minify: true, target: 'es2020', logLevel: 'error' })).code : code;
const hash = s => createHash('sha256').update(s).digest('hex').slice(0, 10);

if (target === 'artifact') {
  const css = await mini(css0, 'css'), js = await mini(wrapped, 'js');
  const html = `<title>Life OS</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="${FONTS}">
<style>
${css}</style>
${BODY}
<script>
${js}</script>
`;
  writeFileSync(root + 'life-os.html', html);
  console.log(html.length);
} else if (target === 'pwa') {
  const out = root + 'dist-pwa/';
  rmSync(out, { recursive: true, force: true }); mkdirSync(out + 'icons', { recursive: true });
  const css = await mini(css0 + '\n' + read('pwa/pwa.css'), 'css'), js = await mini(wrapped, 'js');
  const shimRes = await build({ entryPoints: [root + 'pwa/shim.js'], bundle: true, write: false, format: 'iife', target: 'es2020', minify, logLevel: 'error' });
  const shim = shimRes.outputFiles[0].text;
  const files = { [`app.${hash(js)}.js`]: js, [`app.${hash(css)}.css`]: css, [`shim.${hash(shim)}.js`]: shim };
  for (const [n, c] of Object.entries(files)) writeFileSync(out + n, c);
  const jsName = Object.keys(files).find(n => /^app\..*\.js$/.test(n)), cssName = Object.keys(files).find(n => n.endsWith('.css')), shimName = Object.keys(files).find(n => n.startsWith('shim.'));
  const ver = (read('src/prefs.js').match(/const APP_VER=(\d+)/) || [])[1] || '0';
  const buildId = `${ver}-${hash(js + css + shim)}`;
  // public settings, from Vercel environment variables (all safe to expose)
  const cfg = {
    build: buildId, version: +ver,
    supabaseUrl: process.env.SUPABASE_URL || '', supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '', claude: process.env.CLAUDE_ON === '1',
  };
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#F4F4EF">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Life OS">
<meta name="description" content="Your days, plans and life areas in one place.">
<title>Life OS</title>
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="apple-touch-startup-image" media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1320x2868.png">
<link rel="apple-touch-startup-image" media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1206x2622.png">
<link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1290x2796.png">
<link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1179x2556.png">
<link rel="apple-touch-startup-image" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1284x2778.png">
<link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1170x2532.png">
<link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1125x2436.png">
<link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1242x2688.png">
<link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/splash-828x1792.png">
<link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/splash-750x1334.png">
<link rel="apple-touch-startup-image" media="(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1260x2736.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/${cssName}">
<script>window.LIFEOS_PWA=${JSON.stringify(cfg)};</script>
<script defer src="/${shimName}"></script>
<script defer src="/${jsName}"></script>
</head>
<body>
${BODY}
</body>
</html>
`;
  writeFileSync(out + 'index.html', html);
  writeFileSync(out + 'version.json', JSON.stringify({ build: buildId, version: +ver }));
  cpSync(root + 'pwa/icons', out + 'icons', { recursive: true }); cpSync(root + 'pwa/splash', out + 'splash', { recursive: true });
  writeFileSync(out + 'manifest.webmanifest', read('pwa/manifest.webmanifest'));
  const precache = ['/', '/index.html', `/${jsName}`, `/${cssName}`, `/${shimName}`, '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];
  writeFileSync(out + 'sw.js', read('pwa/sw.js').replace('__BUILD__', buildId).replace('__PRECACHE__', JSON.stringify(precache)));
  console.log('pwa', buildId, Object.entries(files).map(([n, c]) => `${n} ${Math.round(c.length / 1024)}KB`).join(', '));
} else {
  console.error('Unknown target ' + target); process.exit(1);
}
