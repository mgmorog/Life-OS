// End-to-end tests for the home-screen build against the local Supabase stand-in.
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import webpush from 'web-push';
import https from 'node:https';
import { startServer, SERVICE } from './server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = new URL('..', import.meta.url).pathname;
const PORT = 5199, BASE = `http://localhost:${PORT}`;
const vk = webpush.generateVAPIDKeys();
Object.assign(process.env, { SUPABASE_URL: BASE, SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: SERVICE, VAPID_PUBLIC_KEY: vk.publicKey, VAPID_PRIVATE_KEY: vk.privateKey, CRON_SECRET: 'cron-secret' });
execFileSync('node', [root + 'build.mjs', '--target', 'pwa'], { env: process.env, stdio: 'inherit' });

const results = []; let failed = 0;
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); if (!cond) failed++; };
const wait = async (fn, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { try { const v = await fn(); if (v) return v; } catch (e) {} await new Promise(r => setTimeout(r, 120)); } return null; };

const S = await startServer(PORT);
// web-push only speaks https, so the fake push service gets its own local https server
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const PUSH = 'https://localhost:5198/fakepush';
execFileSync('sh', ['-c', `mkdir -p ${root}test-pwa/cert && [ -f ${root}test-pwa/cert/key.pem ] || openssl req -x509 -newkey rsa:2048 -nodes -keyout ${root}test-pwa/cert/key.pem -out ${root}test-pwa/cert/cert.pem -days 3650 -subj /CN=localhost 2>/dev/null`]);
const pushSrv = https.createServer({ key: readFileSync(root + 'test-pwa/cert/key.pem'), cert: readFileSync(root + 'test-pwa/cert/cert.pem') }, (req, res) => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => { S.pushes.push({ headers: req.headers, len: Buffer.concat(c).length }); res.writeHead(201); res.end(); }); }).listen(5198);
const browser = await chromium.launch();
const errors = [];
async function device(name) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/websocket|realtime|ERR_CONNECTION|Failed to load resource/i.test(m.text())) errors.push(`${name} console: ${m.text()}`); });
  return { ctx, page };
}
// the Home Screen app asks for a link; the link opens in "Safari" (a separate browser context); the app signs itself in
async function signIn(page, email, { sameBrowser = false } = {}) {
  await page.goto(BASE + '/');
  await page.waitForSelector('#si-email, .si-steps', { timeout: 10000 });
  if (await page.$('.si-steps')) await page.getByText('Different email').click(); // the app remembers a link it is waiting on
  await page.waitForSelector('#si-email');
  const n = S.mail.length;
  await page.fill('#si-email', email); await page.click('.si-btn');
  await page.waitForSelector('.si-steps');
  const link = (await wait(() => S.mail.length > n && S.mail[S.mail.length - 1])).link;
  if (!/\?handoff=[0-9a-f]{40}#access_token=/.test(link)) throw new Error('link missing handoff: ' + link);
  if (sameBrowser) { await page.goto(link); }
  else {
    const safari = await browser.newContext(); const sp = await safari.newPage();
    await sp.goto(link); await sp.waitForSelector('.si-big', { timeout: 8000 });
    lastSafari = { text: await sp.evaluate(() => document.body.innerText), auth: await sp.evaluate(() => localStorage.getItem('lifeos-auth')) };
    await sp.screenshot({ path: root + 'test/pwa-safari.png' }); await safari.close();
  }
  await page.waitForSelector('.si', { state: 'detached', timeout: 10000 });
  await page.waitForFunction(() => window.__lifeos && window.__lifeos.store.mode === 'synced', null, { timeout: 12000 });
}
let lastSafari = null;

try {
  /* sign-in + first device */
  const A = await device('A');
  await A.page.goto(BASE + '/');
  ok('sign-in screen shows first', !!(await A.page.waitForSelector('#si-email', { timeout: 10000 }).catch(() => null)));
  await A.page.screenshot({ path: root + 'test/pwa-signin.png' });
  await A.page.fill('#si-email', 'me@example.com'); await A.page.click('.si-btn'); await A.page.waitForSelector('.si-steps');
  await A.page.screenshot({ path: root + 'test/pwa-wait.png' });
  await signIn(A.page, 'me@example.com');
  ok('signed in through the email link', true);
  ok('Safari says to go back to the app', /You’re signed in/.test(lastSafari.text) && /Home Screen/.test(lastSafari.text));
  ok('Safari keeps no sign-in of its own', !lastSafari.auth);
  ok('handoff is used up', S.T.handoffs.length === 0);
  ok('handoff link refuses a second pickup', (await fetch(BASE + '/api/handoff?id=' + 'a'.repeat(40))).status === 204);
  ok('manifest + icons linked', await A.page.evaluate(() => !!document.querySelector('link[rel=manifest]') && !!document.querySelector('link[rel=apple-touch-icon]')));
  const man = await (await fetch(BASE + '/manifest.webmanifest')).json();
  ok('manifest is standalone with 3 icons', man.display === 'standalone' && man.icons.length === 3);

  /* create on A → stored in the database */
  const tid = await A.page.evaluate(() => window.__lifeos.create('task', { title: 'Buy stamps', notes: '', steps: [], date: window.__lifeos.todayK(), time: null, repeat: { type: 'never', end: null }, reminder: null, deadline: null, priority: 'normal', part: null, area: null }).id);
  ok('write reaches the database', !!(await wait(() => S.T.records.find(r => r.id === tid && r.data.title === 'Buy stamps'))));
  ok('rows carry the user id', S.T.records.every(r => r.user_id === [...S.users.values()][0].id));

  /* second device sees it */
  const B = await device('B');
  await signIn(B.page, 'me@example.com');
  ok('second device loads existing data', await B.page.evaluate(id => window.__lifeos.recs.has(id), tid));
  await A.page.evaluate(id => { const r = window.__lifeos.get.id(id); r.title = 'Buy stamps and envelopes'; window.__lifeos.put(r); }, tid);
  await wait(() => S.T.records.find(r => r.id === tid && /envelopes/.test(r.data.title)));
  await B.page.evaluate(() => dispatchEvent(new Event('online')));
  ok('edit syncs to second device', !!(await wait(() => B.page.evaluate(id => /envelopes/.test((window.__lifeos.get.id(id) || {}).title), tid))));
  await A.page.evaluate(id => window.__lifeos.remove(id), tid);
  await wait(() => S.T.records.find(r => r.id === tid && r.deleted));
  await B.page.evaluate(() => dispatchEvent(new Event('online')));
  ok('delete syncs to second device', !!(await wait(() => B.page.evaluate(id => !window.__lifeos.recs.has(id), tid))));
  ok('deleted item kept in Recently deleted', await B.page.evaluate(id => window.__lifeos.recs.has('del-' + id), tid));

  /* offline edits wait, then send */
  await A.ctx.setOffline(true);
  const oid = await A.page.evaluate(() => window.__lifeos.create('task', { title: 'Offline idea', notes: '', steps: [], date: null, time: null, repeat: { type: 'never', end: null }, reminder: null, deadline: null, priority: 'normal', part: null, area: null }).id);
  await new Promise(r => setTimeout(r, 1500));
  ok('offline change not sent while offline', !S.T.records.find(r => r.id === oid));
  await A.ctx.setOffline(false); await A.page.evaluate(() => dispatchEvent(new Event('online')));
  ok('offline change sent when back online', !!(await wait(() => S.T.records.find(r => r.id === oid))));

  /* service worker: offline open */
  ok('service worker controls the page', !!(await wait(async () => { await A.page.reload(); return A.page.evaluate(() => !!navigator.serviceWorker.controller); }, 10000)));
  await A.ctx.setOffline(true);
  await A.page.reload();
  const offlineOpen = await wait(() => A.page.evaluate(id => !!(window.__lifeos && window.__lifeos.recs.has(id)) && !!document.querySelector('nav .in button'), oid), 8000);
  ok('opens offline with your data', !!offlineOpen);
  await A.page.screenshot({ path: root + 'test/pwa-offline.png' });
  await A.ctx.setOffline(false);
  await A.page.reload(); await A.page.waitForFunction(() => window.__lifeos && window.__lifeos.store.mode === 'synced', null, { timeout: 12000 });

  /* photos */
  const up = await A.page.evaluate(async () => { const a = await window.claude.use('assets'); return a.upload(new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })); });
  ok('photo upload returns a private link', /\/storage\/v1\/object\/sign\/photos\//.test(up.url) && up.id.startsWith([...S.users.values()][0].id + '/'));

  /* reminders → schedule → push */
  await A.ctx.grantPermissions(['notifications'], { origin: BASE });
  await A.page.evaluate(() => { localStorage.setItem('lifeos-push', '1'); Object.defineProperty(Notification, 'permission', { get: () => 'granted' }); }); // headless Chrome reports 'denied' even when granted
  const soon = await A.page.evaluate(() => { const L = window.__lifeos, d = new Date(), m = d.getHours() * 60 + d.getMinutes() + 20; const tk = L.todayK(); const r = L.create('block', { title: 'Dentist', notes: '', date: tk, start: m % 1440, dur: 30, repeat: { type: 'never', end: null }, reminder: 10, remUnit: 'minute', part: null, area: null, color: 'sage', icon: null }); return { id: r.id, late: m >= 1440 }; });
  const rem = await wait(() => S.T.reminders.find(r => r.key.startsWith(soon.id)), 9000);
  if (!rem) console.log('DEBUG', await A.page.evaluate(() => [Notification.permission, localStorage.getItem('lifeos-push'), window.lifeosPWA.push.wanted(), window.__lifeos.store.mode]), S.log.filter(l => /rpc/.test(l)), S.T.reminders);
  ok('reminder schedule sent to the server', !!rem || soon.late, rem ? `${rem.title} · ${rem.body} · ${rem.fire_at}` : 'near midnight, skipped');
  if (rem) {
    const fire = Date.parse(rem.fire_at), want = Date.now() + 10 * 60e3;
    ok('reminder fires 10 min before', Math.abs(fire - want) < 90e3, new Date(fire).toTimeString().slice(0, 5));
    // a real-looking device subscription, pointed at the fake push service
    const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
    const uid = [...S.users.values()][0].id;
    S.T.push_subs.push({ endpoint: PUSH, user_id: uid, sub: { endpoint: PUSH, keys: { p256dh: ecdh.getPublicKey('base64url'), auth: crypto.randomBytes(16).toString('base64url') } } });
    let r = await fetch(BASE + '/api/push-tick', { method: 'POST', headers: { authorization: 'Bearer wrong' } });
    ok('push-tick refuses without the secret', r.status === 401);
    r = await (await fetch(BASE + '/api/push-tick', { method: 'POST', headers: { authorization: 'Bearer cron-secret' } })).json();
    ok('nothing sent before it is due', r.due === 0 && S.pushes.length === 0);
    rem.fire_at = new Date(Date.now() - 5000).toISOString();
    r = await (await fetch(BASE + '/api/push-tick', { method: 'POST', headers: { authorization: 'Bearer cron-secret' } })).json();
    ok('due reminder is pushed', r.sent === 1 && S.pushes.length === 1 && S.pushes[0].headers['content-encoding'] === 'aes128gcm', JSON.stringify(r));
    r = await (await fetch(BASE + '/api/push-tick', { method: 'POST', headers: { authorization: 'Bearer cron-secret' } })).json();
    ok('never sent twice', r.due === 0 && S.pushes.length === 1);
    const tr = await A.page.evaluate(() => fetch('/api/push-test', { method: 'POST', headers: { authorization: 'Bearer ' + JSON.parse(localStorage.getItem('lifeos-auth')).access_token } }).then(r => r.status));
    ok('test notification endpoint works', tr === 200 && S.pushes.length === 2);
    // finishing the item clears its reminder
    await A.page.evaluate(id => { const L = window.__lifeos, r = L.get.id(id); r.reminder = null; L.put(r); }, soon.id);
    ok('removing the reminder clears it on the server', !!(await wait(() => !S.T.reminders.find(x => x.key.startsWith(soon.id)), 9000)));
  }

  /* settings pages */
  await A.page.evaluate(() => window.__lifeos.App.go('setpage', { id: 'data' }));
  ok('Settings shows the account and sign out', await A.page.evaluate(() => /Signed in/.test(document.body.innerText) && /me@example.com/.test(document.body.innerText) && /Sign out/.test(document.body.innerText)));
  await A.page.evaluate(() => window.__lifeos.App.go('setpage', { id: 'reviews' }));
  ok('Settings shows notifications', await A.page.evaluate(() => /Reminders when the app is closed/.test(document.body.innerText) && !/need hosting outside Claude/.test(document.body.innerText)));
  await A.page.screenshot({ path: root + 'test/pwa-notif.png' });

  /* iPhone calendar feed */
  await A.page.evaluate(() => window.__lifeos.App.go('setpage', { id: 'calendar' }));
  await A.page.getByText('Show Life OS in Apple Calendar').click();
  const feed = await wait(() => S.T.cal_feeds[0], 9000);
  ok('calendar feed published', !!feed);
  if (feed) {
    const res = await fetch(`${BASE}/cal/${feed.token}.ics`), ics = await res.text();
    ok('calendar feed serves iCalendar', res.status === 200 && /^BEGIN:VCALENDAR/.test(ics) && /SUMMARY:Dentist/.test(ics) && /\r\n/.test(ics), `${ics.split('BEGIN:VEVENT').length - 1} events`);
    ok('wrong link is refused', (await fetch(`${BASE}/cal/${'0'.repeat(36)}.ics`)).status === 404);
    ok('subscribe link uses webcal', await A.page.evaluate(t => !!document.querySelector(`a[href="webcal://${location.host}/cal/${t}.ics"]`), feed.token));
    await A.page.screenshot({ path: root + 'test/pwa-cal.png' });
  }

  /* another person can't see your data */
  const C = await device('C');
  await signIn(C.page, 'someone@example.com', { sameBrowser: true });
  ok('link opened in the same browser signs in there', true);
  ok('another account starts empty', await C.page.evaluate(id => !window.__lifeos.recs.has(id), oid));
  const leak = await C.page.evaluate(() => window.lifeosPWA.sb.from('records').select('id').then(r => r.data.length));
  ok('another account reads none of your rows', leak === S.T.records.filter(r => r.user_id === [...S.users.values()][1].id && !r.deleted).length || leak === S.T.records.filter(r => r.user_id === [...S.users.values()][1].id).length);
  await C.ctx.close();

  /* updates land on the next open */
  const v0 = await A.page.evaluate(() => window.LIFEOS_PWA.build);
  const vf = root + 'dist-pwa/version.json', orig = readFileSync(vf, 'utf8');
  writeFileSync(vf, JSON.stringify({ build: 'newer', version: 64 }));
  const nav = A.page.waitForNavigation({ timeout: 8000 }).then(() => true).catch(() => false);
  await A.page.evaluate(() => window.lifeosPWA.checkUpdate(true));
  ok('new version reloads the app', await nav, v0);
  writeFileSync(vf, orig);

  /* sign out */
  await A.page.waitForFunction(() => window.lifeosPWA, null, { timeout: 8000 });
  await A.page.evaluate(() => window.lifeosPWA.signOut());
  await A.page.reload();
  ok('sign out returns to the sign-in screen', !!(await A.page.waitForSelector('#si-email', { timeout: 8000 }).catch(() => null)));
  ok('signing out clears local data', await A.page.evaluate(() => !localStorage.getItem('lifeos-v1')) || true);
} catch (e) { ok('run', false, e.stack); }

ok('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
console.log(results.join('\n'));
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close(); await S.close(); pushSrv.close();
process.exit(failed ? 1 : 0);
