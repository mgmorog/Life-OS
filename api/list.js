// A shared list: /l/<token> opens pwa/share.html, which reads and checks items through here.
// The token lives on the list itself (data.shareToken); anyone with it can see the list and check items off, nothing else.
import { admin } from './_lib.js';
import crypto from 'node:crypto';

const OK = /^[0-9a-f]{36}$/;
async function find(db, token) {
  const { data } = await db.from('records').select('user_id,id,data').eq('data->>shareToken', token).eq('deleted', false).limit(1);
  const row = data && data[0];
  return row && row.data && ['list', 'habit', 'goal'].includes(row.data.kind) ? row : null;
}
const view = d => ({ title: d.title || 'List', sections: (d.sections || []).map(s => typeof s === 'string' ? { id: s, name: s } : { id: s.id, name: s.name || s.title || '' }),
  items: (d.items || []).map(i => ({ id: i.id, t: String(i.t || ''), d: !!i.d, sec: i.sec || null, by: i.by ? String(i.by).slice(0, 40) : null })) });

/* v357 · accountability buddy: a habit or goal shared read-only, with cheers */
const dk = d => d.toISOString().slice(0, 10);
const progress = d => {
  if (d.kind === 'habit') { const days = []; for (let i = 27; i >= 0; i--) { const x = new Date(Date.now() - i * 864e5), k = dk(x), v = (d.logs || {})[k]; days.push({ d: k, on: !!v && (typeof v !== 'number' || v >= (d.goalN || 1)) }); }
    let streak = 0; for (let i = days.length - 1; i >= 0; i--) { if (days[i].on) streak++; else if (i < days.length - 1) break; }
    return { kind: 'habit', title: d.title || 'Habit', target: d.target || null, days, streak, cheers: (d.cheers || []).slice(-5) }; }
  const st = (d.steps || []).filter(s => s.t); const pct = d.track === 'number' ? Math.max(0, Math.min(1, ((d.numCur ?? d.numStart ?? 0) - (d.numStart || 0)) / (((d.numTarget || 0) - (d.numStart || 0)) || 1))) : st.length ? st.filter(s => s.d).length / st.length : (d.finished ? 1 : 0);
  return { kind: 'goal', title: d.title || 'Goal', pct: Math.round(pct * 100), deadline: d.deadline || null, steps: st.map(s => ({ t: String(s.t).slice(0, 120), d: !!s.d })).slice(0, 30), cheers: (d.cheers || []).slice(-5) };
};
export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const token = String((req.query && req.query.t) || (req.body && req.body.t) || '');
  if (!OK.test(token)) return res.status(404).json({ error: 'not found' });
  const db = admin();
  const row = await find(db, token);
  if (!row) return res.status(404).json({ error: 'not found' });
  if (req.method === 'GET') return res.status(200).json(row.data.kind === 'list' ? view(row.data) : progress(row.data));
  if (req.method === 'POST' && row.data.kind !== 'list') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const who = String(body.cheer || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 40);
    if (!who) return res.status(400).json({ error: 'say who you are' });
    const cheers = [...(row.data.cheers || []), { by: who, at: Date.now() }].slice(-50);
    const { error } = await db.from('records').update({ data: { ...row.data, cheers } }).eq('user_id', row.user_id).eq('id', row.id);
    return error ? res.status(500).json({ error: 'save failed' }) : res.status(200).json(progress({ ...row.data, cheers }));
  }
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const items = row.data.items || [];
    if (body.add != null) {
      // someone with the link adds an item: plain text only, short, and the list can't grow without limit
      const t = String(body.add || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 200);
      const by = String(body.by || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 40) || null;
      if (!t) return res.status(400).json({ error: 'empty item' });
      if (items.length >= 500) return res.status(413).json({ error: 'This list is full' });
      items.push({ id: 'i' + crypto.randomUUID().replace(/-/g, '').slice(0, 12), t, d: false, by, addedAt: Date.now(), sec: null });
    } else {
      const it = items.find(i => i.id === body.id);
      if (!it || typeof body.d !== 'boolean') return res.status(400).json({ error: 'bad item' });
      it.d = body.d;
    }
    const { error } = await db.from('records').update({ data: { ...row.data, items } }).eq('user_id', row.user_id).eq('id', row.id);
    if (error) return res.status(500).json({ error: 'save failed' });
    return res.status(200).json(view({ ...row.data, items }));
  }
  res.setHeader('allow', 'GET, POST');
  return res.status(405).end();
}
