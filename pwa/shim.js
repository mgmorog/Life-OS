// Life OS home-screen app: gives the shared app code the same window.claude API it has on claude.ai,
// backed by Supabase (sign-in, database, photo storage) plus push notifications and the calendar feed.
import { createClient } from '@supabase/supabase-js';

const cfg = window.LIFEOS_PWA || {};
const sb = createClient(cfg.supabaseUrl || 'http://localhost', cfg.supabaseAnonKey || 'none', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'lifeos-auth' },
});
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };

/* ---------- errors: the app understands 'unavailable' (retry later) and 'quota_exceeded' ---------- */
function mapErr(e, status) {
  const msg = String((e && (e.message || e.error_description || e.error)) || e || '');
  const err = new Error(msg || 'Request failed');
  if (!navigator.onLine || /fetch|network|load failed|timed? ?out|aborted/i.test(msg) || status === 0 || status >= 500) err.code = 'unavailable';
  else if (status === 413 || /quota|too large|exceed/i.test(msg)) err.code = 'quota_exceeded';
  else if (status === 401 || /jwt|expired/i.test(msg)) err.code = 'unavailable';
  else err.code = (e && e.code) || 'unknown';
  return err;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- sign-in: a link by email ----------
   On iPhone the link opens in Safari, which doesn't share sign-in with the Home Screen app.
   So the app makes a one-time secret, puts it in the link, and waits; Safari hands the session
   back through /api/handoff under that secret, and the app picks it up. */
let session = null;
let signedIn;
const signedInP = new Promise(r => (signedIn = r));
const h = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (v != null && v !== false) n.setAttribute(k, v === true ? '' : v); } kids.flat().forEach(c => c != null && n.append(c)); return n; };
const rand = () => { const b = new Uint8Array(20); crypto.getRandomValues(b); return [...b].map(x => x.toString(16).padStart(2, '0')).join(''); };
const shell = () => { const card = h('div', { class: 'si-card' }); const wrap = h('div', { class: 'si', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'si-h' }, h('div', { class: 'si-mark', 'aria-hidden': 'true' }), h('h1', { id: 'si-h' }, 'Life OS'), card); document.body.append(wrap); return { wrap, card }; };
const sendErr = (error) => /rate|seconds|security purposes/i.test(error.message) ? 'Too many emails for now. Wait a few minutes, then send again.' : /signups? not allowed|not found/i.test(error.message) ? 'This email isn’t set up for this Life OS.' : !navigator.onLine ? 'You’re offline. Connect and try again.' : 'Couldn’t send the email. Try again.';

function signInScreen() {
  const { wrap, card } = shell();
  let email = ls.get('lifeos-email') || '', poller = null;
  const msg = h('p', { class: 'si-msg', role: 'status', 'aria-live': 'polite' });
  const done = s => { clearInterval(poller); ls.set('lifeos-handoff', null); session = s; wrap.classList.add('out'); setTimeout(() => wrap.remove(), 320); signedIn(s); };
  async function send() {
    const id = rand(); ls.set('lifeos-handoff', id);
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${location.origin}/?handoff=${id}` } });
    return error;
  }
  async function check() {
    const id = ls.get('lifeos-handoff'); if (!id) return;
    try {
      const r = await fetch('/api/handoff?id=' + id, { cache: 'no-store' }); if (r.status !== 200) return;
      const { refresh_token } = await r.json();
      const { data, error } = await sb.auth.refreshSession({ refresh_token });
      if (!error && data.session) done(data.session);
    } catch (e) {}
  }
  const stepEmail = () => {
    clearInterval(poller); card.replaceChildren(); msg.textContent = '';
    const inp = h('input', { id: 'si-email', type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'you@example.com', value: email, required: true, 'aria-label': 'Email' });
    const btn = h('button', { class: 'si-btn', type: 'submit' }, 'Email me a sign-in link');
    const form = h('form', { onsubmit: async e => {
      e.preventDefault(); if (btn.disabled) return; email = inp.value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(email)) { msg.textContent = 'Enter your email address.'; return; }
      btn.disabled = true; btn.textContent = 'Sending…'; msg.textContent = '';
      const error = await send();
      btn.disabled = false; btn.textContent = 'Email me a sign-in link';
      if (error) { msg.textContent = sendErr(error); return; }
      ls.set('lifeos-email', email); stepWait();
    } }, h('p', { class: 'si-sub' }, 'Sign in to keep your plans in sync across your devices.'), inp, btn);
    card.append(form, msg); setTimeout(() => inp.focus(), 50);
  };
  const stepWait = () => {
    card.replaceChildren(); msg.textContent = '';
    card.append(
      h('p', { class: 'si-sub' }, 'We sent a sign-in link to ', h('b', {}, email), '.'),
      h('ol', { class: 'si-steps' }, h('li', {}, 'Open the email and tap the link.'), h('li', {}, 'Come back here. You’ll be signed in.')),
      h('div', { class: 'si-wait', 'aria-hidden': 'true' }, h('span'), h('span'), h('span')),
      h('div', { class: 'si-links' },
        h('button', { type: 'button', class: 'si-link', onclick: async e => { const b = e.currentTarget; b.disabled = true; const error = await send(); b.disabled = false; msg.textContent = error ? sendErr(error) : 'Sent a new link. Use the newest email.'; } }, 'Send again'),
        h('button', { type: 'button', class: 'si-link', onclick: stepEmail }, 'Different email')),
      msg);
    clearInterval(poller); poller = setInterval(() => { if (!document.hidden) check(); }, 2000);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  if (ls.get('lifeos-handoff') && email) stepWait(); else stepEmail();
}

/* the page Safari opens from the email link */
async function landing() {
  const hp = new URLSearchParams(location.hash.slice(1)), qp = new URLSearchParams(location.search);
  const handoff = qp.get('handoff'), at = hp.get('access_token'), rt = hp.get('refresh_token'), err = hp.get('error_description') || qp.get('error_description');
  if (!at && !err) return false;
  history.replaceState(null, '', '/');
  if (err) { await ready(); const { card } = shell(); card.append(h('p', { class: 'si-sub' }, /expired|invalid/i.test(err) ? 'That link has expired or was already used. Open Life OS and send a new one.' : 'That link didn’t work. Open Life OS and send a new one.')); return true; }
  // this browser is the one waiting (desktop, or Safari without the Home Screen app): just sign in here
  if (!handoff || ls.get('lifeos-handoff') === handoff) { ls.set('lifeos-handoff', null); const { data } = await sb.auth.setSession({ access_token: at, refresh_token: rt }); if (data && data.session) { session = data.session; signedIn(session); } return 'continue'; }
  // otherwise pass the session to the Home Screen app, and leave nothing signed in here
  await ready(); const { card } = shell();
  const r = await fetch('/api/handoff', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + at }, body: JSON.stringify({ id: handoff, refresh_token: rt }) }).catch(() => null);
  card.append(r && r.ok
    ? h('div', {}, h('p', { class: 'si-big' }, 'You’re signed in.'), h('p', { class: 'si-sub' }, 'Go back to Life OS on your Home Screen. It opens signed in. You can close this tab.'))
    : h('p', { class: 'si-sub' }, 'Couldn’t finish signing in. Go back to Life OS and send a new link.'));
  return true;
}
const ready = () => new Promise(r => document.body ? r() : addEventListener('DOMContentLoaded', r));

async function startAuth() {
  const l = await landing().catch(e => { console.warn(e); return false; });
  if (l === true) return; // the handoff page; the app itself doesn't start here
  sb.auth.onAuthStateChange((ev, s) => { if (s) session = s; });
  if (l === 'continue' && session) return;
  const { data } = await sb.auth.getSession().catch(() => ({ data: {} }));
  if (data && data.session) { session = data.session; signedIn(session); }
  else { await ready(); signInScreen(); }
}
const token = async () => { const { data } = await sb.auth.getSession(); return data.session ? data.session.access_token : session && session.access_token; };

/* ---------- db: the same small Firestore-like surface the app uses on claude.ai ---------- */
function collection(path) {
  const uid = path.split('/').pop();
  let maxTs = 0, cb = null, errCb = null, loaded = false, chan = null, live = false, poll = null, busy = false;
  const snap = (rows, first) => {
    const alive = rows.filter(r => !r.deleted), gone = rows.filter(r => r.deleted);
    return {
      docs: alive.map(r => ({ id: r.id, data: () => r.data })),
      metadata: { fromCache: false },
      docChanges: () => [...alive.map(r => ({ type: first ? 'added' : 'modified', doc: { id: r.id } })), ...gone.map(r => ({ type: 'removed', doc: { id: r.id } }))],
    };
  };
  const seen = rows => rows.forEach(r => { if (+r.updated_at > maxTs) maxTs = +r.updated_at; });
  async function fetchRows(since) {
    const size = 1000; let from = 0, out = [];
    for (;;) {
      let q = sb.from('records').select('id,data,deleted,updated_at').eq('user_id', uid).order('updated_at', { ascending: true }).order('id', { ascending: true }).range(from, from + size - 1);
      q = since ? q.gt('updated_at', since) : q.eq('deleted', false);
      const { data, error, status } = await q;
      if (error) throw mapErr(error, status);
      out = out.concat(data || []); if (!data || data.length < size) break; from += size;
    }
    return out;
  }
  async function catchUp() {
    if (!loaded || busy || !cb) return; busy = true;
    try { const rows = await fetchRows(maxTs); seen(rows); if (rows.length) cb(snap(rows, false)); } catch (e) {} finally { busy = false; }
  }
  async function firstLoad() {
    for (let i = 0; ; i++) {
      try { const rows = await fetchRows(0); seen(rows); loaded = true; cb && cb(snap(rows, true)); return; }
      catch (e) { if (e.code !== 'unavailable' && i > 2) { errCb && errCb(e); return; } await sleep(Math.min(30000, 1500 * 2 ** Math.min(i, 5))); }
    }
  }
  function realtime() {
    try {
      chan = sb.channel('records:' + uid)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'records', filter: 'user_id=eq.' + uid }, p => {
          const r = p.new; if (!r || !r.id) return; seen([r]); cb && cb(snap([r], false));
        })
        .subscribe(st => { live = st === 'SUBSCRIBED'; if (live) catchUp(); });
    } catch (e) { live = false; }
    // a light poll covers the moments realtime is down (phone asleep, flaky signal)
    let n = 0; poll = setInterval(() => { n++; if (!document.hidden && (!live || n % 15 === 0)) catchUp(); }, 20000);
    addEventListener('online', catchUp);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) catchUp(); });
  }
  return {
    doc(id) {
      return {
        async set(data) {
          const { error, status } = await sb.from('records').upsert({ user_id: uid, id, data, deleted: false }, { onConflict: 'user_id,id' });
          if (error) throw mapErr(error, status);
        },
        async delete() {
          const { error, status } = await sb.from('records').upsert({ user_id: uid, id, data: {}, deleted: true }, { onConflict: 'user_id,id' });
          if (error) throw mapErr(error, status);
        },
      };
    },
    onSnapshot(next, err) {
      cb = next; errCb = err; firstLoad().then(() => { if (loaded) realtime(); });
      return () => { cb = null; clearInterval(poll); chan && sb.removeChannel(chan); };
    },
  };
}

/* ---------- photos: a private storage bucket; links are signed so only your app can open them ---------- */
const assets = {
  async upload(blob) {
    const uid = session.user.id, ext = ((blob.type || '').split('/')[1] || 'bin').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '');
    const path = `${uid}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const up = await sb.storage.from('photos').upload(path, blob, { contentType: blob.type || 'application/octet-stream', upsert: false });
    if (up.error) throw mapErr(up.error, up.error.statusCode ? +up.error.statusCode : 0);
    const sg = await sb.storage.from('photos').createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (sg.error) throw mapErr(sg.error);
    return { id: path, url: sg.data.signedUrl };
  },
};

/* ---------- saving files: the share sheet on iPhone (Save to Files), a download elsewhere ---------- */
const downloads = {
  async save({ filename, data }) {
    const type = /\.json$/.test(filename) ? 'application/json' : /\.csv$/.test(filename) ? 'text/csv' : /\.ics$/.test(filename) ? 'text/calendar' : /\.png$/.test(filename) ? 'image/png' : /\.jpe?g$/.test(filename) ? 'image/jpeg' : 'text/plain';
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const file = new File([blob], filename, { type: blob.type || type });
    if (isIOS && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; } catch (e) { if (e && e.name === 'AbortError') { const x = new Error('declined'); x.code = 'declined'; throw x; } }
    }
    const url = URL.createObjectURL(blob), a = h('a', { href: url, download: filename });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  },
};

/* ---------- Claude, through this app's own server (only when switched on in Vercel) ---------- */
const blobToData = b => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(b); });
async function askClaude(prompt, opts = {}, json = false) {
  const images = opts.images ? await Promise.all(opts.images.slice(0, 3).map(blobToData)) : [];
  let res;
  try { res = await fetch('/api/claude', { method: 'POST', signal: opts.signal, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (await token()) }, body: JSON.stringify({ prompt, images, json, quick: opts.modelTier === 'quick' }) }); }
  catch (e) { const x = new Error('offline'); x.code = e && e.name === 'AbortError' ? 'aborted' : 'unavailable'; throw x; }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { const x = new Error(body.error || 'Claude request failed'); x.code = res.status === 429 ? 'rate_limited' : res.status === 401 ? 'session_expired' : body.code || 'unknown'; throw x; }
  return body;
}
const sample = cfg.claude ? Object.assign((p, o) => askClaude(p, o, false).then(b => ({ text: b.text })), { json: (p, o) => askClaude(p, o, true).then(b => b.json) }) : null;

/* ---------- push notifications ---------- */
const b64u = s => { const p = '='.repeat((4 - (s.length % 4)) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
const push = {
  supported: () => !!cfg.vapidPublicKey && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && (!isIOS || standalone),
  why: () => !cfg.vapidPublicKey ? 'Notifications aren’t set up on the server yet.' : isIOS && !standalone ? 'Add Life OS to your Home Screen first (Share › Add to Home Screen), then open it from there.' : 'This browser doesn’t support notifications.',
  wanted: () => ls.get('lifeos-push') === '1' && 'Notification' in window && Notification.permission === 'granted',
  async enable() {
    try {
      const perm = await Notification.requestPermission(); if (perm !== 'granted') return 'denied';
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(cfg.vapidPublicKey) }));
      const j = sub.toJSON();
      const { error } = await sb.from('push_subs').upsert({ endpoint: j.endpoint, user_id: session.user.id, sub: j, ua: navigator.userAgent.slice(0, 200) }, { onConflict: 'endpoint' });
      if (error) return 'error';
      ls.set('lifeos-push', '1'); return 'ok';
    } catch (e) { console.warn(e); return 'error'; }
  },
  async disable() {
    ls.set('lifeos-push', null);
    try { const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub) { await sb.from('push_subs').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe(); } } catch (e) {}
  },
  async test() { try { const r = await fetch('/api/push-test', { method: 'POST', headers: { authorization: 'Bearer ' + (await token()) } }); return r.ok; } catch (e) { return false; } },
};

/* ---------- updates: new versions arrive on the next open ---------- */
let hiddenAt = 0;
async function checkUpdate(manual) {
  try {
    const v = await (await fetch('/version.json', { cache: 'no-store' })).json();
    if (!v.build || v.build === cfg.build) return false;
    const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration()); if (reg) await reg.update().catch(() => {});
    let tried = ''; try { tried = sessionStorage.getItem('lifeos-upd') || ''; } catch (e) {}
    if (manual || (tried !== v.build && !document.querySelector('.sheet.on,.menu,input:focus,textarea:focus'))) { try { sessionStorage.setItem('lifeos-upd', v.build); } catch (e) {} location.reload(); return true; }
    const bar = document.getElementById('upd') || h('button', { id: 'upd', class: 'upd', onclick: () => location.reload() }, 'A new version of Life OS is ready. ', h('b', {}, 'Reload'));
    document.body.append(bar); return true;
  } catch (e) { return false; }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (Date.now() - hiddenAt > 20000) checkUpdate(false); });
addEventListener('load', () => setTimeout(() => checkUpdate(false), 5000));
if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(e => console.warn('sw', e)));

/* ---------- what the shared app code sees ---------- */
const uidP = signedInP.then(s => s.user.id);
window.claude = {
  async use(name) {
    if (name === 'user') { const id = await uidP; return { id: async () => id }; }
    if (name === 'db') { await uidP; return { collection }; }
    if (name === 'assets') { await uidP; return assets; }
    if (name === 'downloads') return downloads;
    if (name === 'sample') return sample;
    return null;
  },
};
window.lifeosPWA = {
  email: () => (session && session.user && session.user.email) || ls.get('lifeos-email') || '',
  async signOut() { await push.disable(); await sb.auth.signOut().catch(() => {}); ls.set('lifeos-auth', null); },
  push, checkUpdate,
  async setReminders(items) { const { error } = await sb.rpc('set_reminders', { items }); if (error) throw mapErr(error); },
  async setCalFeed(tok, ics) { const { error } = await sb.from('cal_feeds').upsert({ token: tok, user_id: session.user.id, ics, updated_at: new Date().toISOString() }, { onConflict: 'token' }); if (error) throw mapErr(error); },
  async dropCalFeed(tok) { await sb.from('cal_feeds').delete().eq('token', tok); },
  sb,
};
document.documentElement.classList.add('pwa'); if (standalone) document.documentElement.classList.add('standalone');
startAuth();
// opened in Safari on iPhone: once in a while, point to the Home Screen app, which runs full screen with reminders
if (isIOS && !standalone) setTimeout(function nudge() {
  if (!session || document.querySelector('.si,.sheet,.a2hs')) return setTimeout(nudge, 5000);
  const last = +ls.get('lifeos-a2hs') || 0; if (Date.now() - last < 7 * 864e5) return;
  const bar = h('div', { class: 'a2hs', role: 'status' }, h('img', { src: '/icons/apple-touch-icon.png', alt: '' }),
    h('div', { style: 'flex:1;min-width:0' }, h('b', {}, 'Open Life OS from your Home Screen'), h('small', {}, 'It runs full screen there, with reminders. Not added yet? Tap Share › Add to Home Screen.')),
    h('button', { 'aria-label': 'Dismiss', onclick: () => { ls.set('lifeos-a2hs', Date.now()); bar.remove(); } }, '×'));
  document.body.append(bar); ls.set('lifeos-a2hs', Date.now());
}, 2500);
