// A small stand-in for Supabase + Vercel, for testing the home-screen app locally.
// Serves dist-pwa/, the /api functions, and the parts of Supabase's auth, database and storage APIs the app uses.
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
export const SERVICE = 'service-key';
export function startServer(port) {
  const users = new Map(), tokens = new Map(); // email → user ; access token → user
  const T = { records: [], push_subs: [], reminders: [], cal_feeds: [], handoffs: [] };
  const mail = [];
  const KEYS = { records: ['user_id', 'id'], push_subs: ['endpoint'], reminders: ['user_id', 'key'], cal_feeds: ['token'], handoffs: ['id'] };
  const files = new Map(), pushes = [], log = [];
  let clock = Date.now();
  const stamp = () => (clock = Math.max(clock + 1, Date.now()));
  const sessionFor = u => { const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url'); const access_token = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: u.id, email: u.email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, n: Math.random() }) + '.sig'; tokens.set(access_token, u); return { access_token, refresh_token: 'ref-' + access_token, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: u }; };
  const who = req => { const b = String(req.headers.authorization || '').replace(/^Bearer /, ''); if (b === SERVICE) return 'admin'; return tokens.get(b) || null; };
  const body = req => new Promise(r => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
  const json = (res, code, obj, hd = {}) => { res.writeHead(code, { 'content-type': 'application/json', ...hd }); res.end(obj === undefined ? '' : JSON.stringify(obj)); };
  const filt = (rows, q) => {
    for (const [k, v] of q.entries()) {
      if (['select', 'order', 'offset', 'limit', 'on_conflict', 'columns'].includes(k)) continue;
      const i = v.indexOf('.'), op = v.slice(0, i), val = v.slice(i + 1);
      const num = x => (typeof x === 'number' ? x : isNaN(+x) || /T/.test(String(x)) ? x : +x);
      const cmp = (a, b) => { const A = typeof a === 'string' && /^\d{4}-\d\d-\d\dT/.test(a) ? Date.parse(a) : a, B = typeof a === 'string' && /^\d{4}-\d\d-\d\dT/.test(a) ? Date.parse(b) : num(b); return A < B ? -1 : A > B ? 1 : 0; };
      rows = rows.filter(r => op === 'eq' ? String(r[k]) === val : op === 'neq' ? String(r[k]) !== val : op === 'is' ? (val === 'null' ? r[k] == null : String(r[k]) === val) : op === 'gt' ? cmp(r[k], val) > 0 : op === 'gte' ? cmp(r[k], val) >= 0 : op === 'lt' ? cmp(r[k], val) < 0 : op === 'lte' ? cmp(r[k], val) <= 0 : true);
    }
    return rows;
  };
  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname, q = u.searchParams;
    log.push(req.method + ' ' + p);
    try {
      /* ---- auth ---- */
      if (p === '/auth/v1/otp') { const b = JSON.parse(await body(req)); const isNew = !users.has(b.email); if (isNew) users.set(b.email, { id: 'u' + (users.size + 1) + '0000000-0000-0000-0000-000000000000'.slice(0, 30), email: b.email, aud: 'authenticated', role: 'authenticated' }); const ss = sessionFor(users.get(b.email)); mail.push({ to: b.email, link: (q.get('redirect_to') || 'http://x/') + `#access_token=${ss.access_token}&refresh_token=${ss.refresh_token}&expires_in=3600&token_type=bearer&type=magiclink` }); return json(res, 200, {}); }
      if (p === '/auth/v1/verify') { const b = JSON.parse(await body(req)); const us = users.get(b.email); if (!us || b.token !== '123456') return json(res, 403, { code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' }); return json(res, 200, sessionFor(us)); }
      if (p === '/auth/v1/user') { const w = who(req); return w && w !== 'admin' ? json(res, 200, w) : json(res, 401, { msg: 'invalid' }); }
      if (p === '/auth/v1/token') { const b = JSON.parse(await body(req)); const us = tokens.get(String(b.refresh_token).replace(/^ref-/, '')); return us ? json(res, 200, sessionFor(us)) : json(res, 400, { error: 'invalid_grant' }); }
      if (p === '/auth/v1/logout') { res.writeHead(204); return res.end(); }
      /* ---- database ---- */
      if (p.startsWith('/rest/v1/')) {
        const w = who(req); if (!w) return json(res, 401, { message: 'JWT expired' });
        const name = p.slice(9);
        if (name === 'rpc/set_reminders') {
          const { items } = JSON.parse(await body(req)), uid = w.id, keys = new Set(items.map(x => x.key));
          T.reminders = T.reminders.filter(r => r.user_id !== uid || keys.has(r.key));
          for (const x of items) { const cur = T.reminders.find(r => r.user_id === uid && r.key === x.key); const row = { user_id: uid, key: x.key, fire_at: x.fire_at, title: x.title, body: x.body, url: x.url, sent_at: cur && cur.fire_at === x.fire_at ? cur.sent_at : null }; if (cur) Object.assign(cur, row); else T.reminders.push(row); }
          res.writeHead(204); return res.end();
        }
        const tab = T[name]; if (!tab) return json(res, 404, { message: 'no table' });
        const own = r => w === 'admin' || r.user_id === w.id;
        if (req.method === 'GET') {
          let rows = filt(tab.filter(own), q);
          const ord = q.get('order'); if (ord) { const ks = ord.split(',').map(s => s.split('.')); rows = rows.slice().sort((a, b) => { for (const [k, d] of ks) { if (a[k] < b[k]) return d === 'desc' ? 1 : -1; if (a[k] > b[k]) return d === 'desc' ? -1 : 1; } return 0; }); }
          const off = +(q.get('offset') || 0), lim = q.get('limit') ? +q.get('limit') : 1e9; rows = rows.slice(off, off + lim);
          const sel = q.get('select'); if (sel && sel !== '*') rows = rows.map(r => Object.fromEntries(sel.split(',').map(c => [c, r[c]])));
          return json(res, 200, rows);
        }
        if (req.method === 'POST') {
          let b = JSON.parse(await body(req)); b = Array.isArray(b) ? b : [b];
          for (const row of b) {
            if (w !== 'admin' && row.user_id !== w.id) return json(res, 403, { message: 'new row violates row-level security policy' });
            const ks = KEYS[name], cur = tab.find(r => ks.every(k => r[k] === row[k]));
            const v = Object.assign({}, name === 'records' ? { updated_at: stamp() } : {}, row);
            if (cur) Object.assign(cur, v); else tab.push(v);
          }
          res.writeHead(201); return res.end();
        }
        if (req.method === 'PATCH') {
          const b = JSON.parse(await body(req)); const rows = filt(tab.filter(own), q); rows.forEach(r => Object.assign(r, b));
          return /representation/.test(req.headers.prefer || '') ? json(res, 200, rows) : (res.writeHead(204), res.end());
        }
        if (req.method === 'DELETE') { const rows = new Set(filt(tab.filter(own), q)); T[name] = tab.filter(r => !rows.has(r)); return /representation/.test(req.headers.prefer || '') ? json(res, 200, [...rows]) : (res.writeHead(204), res.end()); }
      }
      /* ---- storage ---- */
      if (p.startsWith('/storage/v1/object/sign/')) {
        const path = decodeURIComponent(p.slice('/storage/v1/object/sign/'.length));
        if (req.method === 'POST') return json(res, 200, { signedURL: '/object/sign/' + path + '?token=t' });
        const f = files.get(path); if (!f) return json(res, 404, {}); res.writeHead(200, { 'content-type': f.type }); return res.end(f.buf);
      }
      if (p.startsWith('/storage/v1/object/') && req.method === 'POST') {
        const w = who(req); const path = decodeURIComponent(p.slice('/storage/v1/object/'.length)); const [, owner] = path.split('/');
        if (!w || (w !== 'admin' && owner !== w.id)) return json(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'denied' });
        files.set(path, { buf: await body(req), type: req.headers['content-type'] || 'application/octet-stream' }); return json(res, 200, { Key: path });
      }
      /* ---- fake push service ---- */
      if (p === '/fakepush') { pushes.push({ headers: req.headers, len: (await body(req)).length }); res.writeHead(201); return res.end(); }
      /* ---- Vercel functions ---- */
      const api = p === '/api/handoff' ? 'handoff' : p === '/api/push-tick' ? 'push-tick' : p === '/api/push-test' ? 'push-test' : p === '/api/claude' ? 'claude' : p === '/api/cal' || p.startsWith('/cal/') ? 'cal' : null;
      if (api) {
        const mod = await import(join(root, 'api', api + '.js'));
        const raw = await body(req); req.body = raw.length && /json/.test(req.headers['content-type'] || '') ? JSON.parse(raw) : {};
        req.query = Object.fromEntries(q.entries()); if (p.startsWith('/cal/')) req.query.token = p.slice(5);
        let code = 200; const r2 = { status(c) { code = c; return r2; }, setHeader: (k, v) => res.setHeader(k, v), json(o) { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); }, send(s) { res.writeHead(code); res.end(s); }, end(s) { res.writeHead(code); res.end(s); } };
        return await mod.default(req, r2);
      }
      /* ---- static app ---- */
      let f = join(root, 'dist-pwa', p === '/' ? 'index.html' : p);
      if (!existsSync(f) || statSync(f).isDirectory()) f = join(root, 'dist-pwa', 'index.html');
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
      res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream', 'cache-control': /sw\.js|version|index/.test(f) ? 'no-cache' : 'max-age=60' });
      res.end(readFileSync(f));
    } catch (e) { console.error(e); json(res, 500, { message: String(e) }); }
  });
  return new Promise(r => srv.listen(port, () => r({ srv, T, mail, users, files, pushes, log, close: () => new Promise(c => { srv.closeAllConnections && srv.closeAllConnections(); srv.close(c); }) })));
}
