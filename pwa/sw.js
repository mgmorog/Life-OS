/* Life OS service worker: opens instantly and offline, shows reminders */
const BUILD = '__BUILD__';
const PRECACHE = __PRECACHE__;
const SHELL = 'lifeos-shell-' + BUILD, FONTS = 'lifeos-fonts';
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('lifeos-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const timeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('slow')), ms))]);
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    // newest page when online (so updates land on the next open), the saved copy when offline or very slow
    e.respondWith((async () => {
      const net = fetch(req).then(r => { if (r.ok) caches.open(SHELL).then(c => c.put('/index.html', r.clone())); return r; });
      try { return await timeout(net.then(r => r.clone()), 3500); }
      catch (err) { const hit = await caches.match('/index.html'); return hit || net; }
    })());
    return;
  }
  if (url.origin === location.origin && /^\/(app|shim)\.[0-9a-f]+\.(js|css)$|^\/icons\//.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(SHELL).then(x => x.put(req, c)); } return r; })));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(async c => { const hit = await c.match(req); const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; }));
  }
});
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Life OS', { body: d.body || '', tag: d.tag || undefined, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: { url: d.url || '/#today' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/#today';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { const c = cs.find(x => new URL(x.url).origin === location.origin); if (c) { c.navigate(url).catch(() => {}); return c.focus(); } return self.clients.openWindow(url); }));
});
