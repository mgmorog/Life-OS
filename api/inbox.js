// v357 · Add to Life OS from anywhere: iPhone Shortcuts, the share menu (through a Shortcut) and forwarded email.
// Each person has a private key in their settings (inboxKey). Anyone with the key can add ideas, log a habit by name,
// or read today's open tasks as text — nothing else. Make a new key in Settings to turn an old one off.
import { admin } from './_lib.js';
import crypto from 'node:crypto';

const OK = /^[0-9a-f]{32,40}$/;
const clean = (s, n) => String(s || '').replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').trim().slice(0, n);
const dayKey = (tz) => { try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } };
async function owner(db, key) {
  const { data } = await db.from('records').select('user_id,data').eq('id', 'settings').eq('data->>inboxKey', key).limit(1);
  return data && data[0] ? data[0] : null;
}
export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch (e) { return Object.fromEntries(new URLSearchParams(req.body)); } })() : (req.body || {});
  const key = String((req.query && req.query.key) || body.key || '');
  if (!OK.test(key)) return res.status(404).json({ error: 'not found' });
  const db = admin();
  const own = await owner(db, key);
  if (!own) return res.status(404).json({ error: 'not found' });
  const uid = own.user_id, tz = (own.data && own.data.tz) || (req.query && req.query.tz) || null, tk = dayKey(tz);
  if (req.method === 'GET') {
    // what's on today, as plain text for Siri
    const { data } = await db.from('records').select('data').eq('user_id', uid).eq('deleted', false).eq('data->>kind', 'task').eq('data->>date', tk).limit(200);
    const open = (data || []).map(r => r.data).filter(t => !(t.doneDates && t.doneDates[tk])).map(t => t.title).filter(Boolean);
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return res.status(200).send(open.length ? `${open.length} thing${open.length > 1 ? 's' : ''} today: ${open.slice(0, 8).join(', ')}.` : 'Nothing left on your list today.');
  }
  if (req.method !== 'POST') { res.setHeader('allow', 'GET, POST'); return res.status(405).end(); }
  const now = Date.now();
  // log a habit by name
  if (body.habit) {
    const name = clean(body.habit, 80).toLowerCase();
    const { data } = await db.from('records').select('id,data').eq('user_id', uid).eq('deleted', false).eq('data->>kind', 'habit').limit(200);
    const h = (data || []).find(r => String(r.data.title || '').toLowerCase() === name) || (data || []).find(r => String(r.data.title || '').toLowerCase().includes(name));
    if (!h) return res.status(404).json({ error: `No habit called ${body.habit}` });
    const logs = Object.assign({}, h.data.logs || {}); logs[tk] = h.data.track === 'count' ? (+logs[tk] || 0) + 1 : true;
    const { error } = await db.from('records').update({ data: { ...h.data, logs, updatedAt: now } }).eq('user_id', uid).eq('id', h.id);
    return error ? res.status(500).json({ error: 'save failed' }) : res.status(200).json({ ok: true, logged: h.data.title });
  }
  // an idea for the Inbox: from a Shortcut ({text, note, url}) or an email service ({subject, text|TextBody|plain, from})
  const isMail = !!(body.subject || body.Subject);
  const title = clean((isMail ? body.subject || body.Subject : body.text || body.title) || '', 200);
  const note = clean(body.note || body.url || body.TextBody || body['body-plain'] || body.plain || (body.subject ? body.text : '') || '', 4000);
  if (!title && !note) return res.status(400).json({ error: 'Nothing to add' });
  const id = 'i' + crypto.randomUUID().replace(/-/g, '').slice(0, 15);
  const data = { id, kind: 'idea', title: title || note.split('\n')[0].slice(0, 120), notes: title ? note : note.split('\n').slice(1).join('\n'), photos: [], createdAt: now, updatedAt: now, via: body.subject || body.Subject ? 'email' : 'shortcut' };
  const { error } = await db.from('records').insert({ user_id: uid, id, data, deleted: false });
  return error ? res.status(500).json({ error: 'save failed' }) : res.status(200).json({ ok: true });
}
