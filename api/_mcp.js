// v365 · Life OS for Claude: the shared core behind /api/mcp and /api/oauth.
// Reads and writes the same `records` rows the app syncs, for one signed-in person, through the service role.
// Every change Claude makes is also written as a `claudelog` record, which the app shows in the Autopilot log with Undo.
import crypto from 'node:crypto';
import { admin } from './_lib.js';

export const db0 = () => admin();
export const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
export const rand = (n = 32) => crypto.randomBytes(n).toString('base64url');
export const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64url');
export const unb64u = s => { try { return JSON.parse(Buffer.from(String(s), 'base64url').toString()); } catch (e) { return null; } };
const secret = () => process.env.MCP_SECRET || sha('lifeos-mcp|' + (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev'));
export const sign = s => crypto.createHmac('sha256', secret()).update(String(s)).digest('base64url');
export const origin = req => { const h = req.headers || {}; const host = h['x-forwarded-host'] || h.host || 'localhost'; const proto = h['x-forwarded-proto'] || (/^(localhost|127\.)/.test(host) ? 'http' : 'https'); return `${String(proto).split(',')[0]}://${String(host).split(',')[0]}`; };

/* ---------- dates, in the person's own time zone ---------- */
export function nowIn(tz) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(new Date()).map(x => [x.type, x.value]));
  return { dk: `${p.year}-${p.month}-${p.day}`, min: (+p.hour % 24) * 60 + +p.minute };
}
const D = dk => { const [y, m, d] = dk.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const K = d => d.toISOString().slice(0, 10);
export const addK = (dk, n) => { const d = D(dk); d.setUTCDate(d.getUTCDate() + n); return K(d); };
export const between = (a, b) => Math.round((D(b) - D(a)) / 864e5);
export const monIdx = dk => (D(dk).getUTCDay() + 6) % 7;
export const DOWN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const weekStart = dk => addK(dk, -monIdx(dk));
export const fmtT = m => { if (m == null) return null; const h = Math.floor(m / 60) % 24, mm = m % 60; return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
export const parseT = s => { if (s == null || s === '') return null; if (typeof s === 'number') return s; const m = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(String(s).trim()); if (!m) return null; let h = +m[1] % (m[3] ? 12 : 24); if (/pm/i.test(m[3] || '')) h += 12; return h * 60 + +m[2]; };
export const okDate = s => /^\d{4}-\d\d-\d\d$/.test(String(s || ''));

/* the app's repeat rules (core.js occursOn), on date keys */
export function occurs(start, rep, dk, skip) {
  if (!start || dk < start) return false; if (skip && skip.includes(dk)) return false; if (dk === start) return true;
  const r = rep || { type: 'never' }; if (r.type === 'never' || !r.type) return false; if (r.end && dk > r.end) return false;
  const days = between(start, dk), n = Math.max(1, r.n || 1), u = r.unit || (r.type === 'daily' ? 'day' : r.type === 'monthly' ? 'month' : r.type === 'yearly' ? 'year' : 'week');
  if (u === 'day') return days % n === 0;
  if (u === 'week') { const wk = Math.round(between(weekStart(start), weekStart(dk)) / 7); return wk % n === 0 && (r.days || [monIdx(start)]).includes(monIdx(dk)); }
  if (u === 'month') { const a = D(start), b = D(dk); const mo = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth(); return mo % n === 0 && b.getUTCDate() === a.getUTCDate(); }
  if (u === 'year') return dk.slice(5) === start.slice(5);
  return false;
}
export const isDoneOn = (r, dk) => !!(r.doneDates && r.doneDates[dk]);
export const isOpen = t => { if (t.archived) return false; if (!t.date) return !(t.doneDates && Object.keys(t.doneDates).length); return (!t.repeat || t.repeat.type === 'never') ? !isDoneOn(t, t.date) : true; };
export const habitDone = (h, dk) => { const v = (h.logs || {})[dk]; if (!v) return false; if ((h.track === 'count' || h.track === 'time') && typeof v === 'number') return v >= (h.goalN || 1); return true; };
export const habitWeekly = h => !(h.days && h.days.length) && !h.everyN;
export const habitDue = (h, dk) => !h.paused && !h.archived && (h.days && h.days.length ? h.days.includes(monIdx(dk)) && (!h.startDate || dk >= h.startDate) : true);

/* ---------- one person's data ---------- */
export async function load(db, uid) {
  const { data, error } = await db.from('records').select('id,data,deleted').eq('user_id', uid).eq('deleted', false);
  if (error) throw new Error(error.message);
  const all = (data || []).map(r => Object.assign({ id: r.id }, r.data || {}));
  const byId = new Map(all.map(r => [r.id, r]));
  const settings = byId.get('settings') || {};
  return { all, byId, settings, tz: settings.tz || 'America/New_York', of: k => all.filter(r => r.kind === k) };
}
export const newId = p => p + Date.now().toString(36) + crypto.randomBytes(4).toString('hex').slice(0, 5);
export async function saveRec(db, uid, rec) {
  rec.updatedAt = Date.now(); if (!rec.createdAt) rec.createdAt = rec.updatedAt;
  const { error } = await db.from('records').upsert({ user_id: uid, id: rec.id, data: rec, deleted: false }, { onConflict: 'user_id,id' });
  if (error) throw new Error(error.message); return rec;
}
export async function dropRec(db, uid, id) { const { error } = await db.from('records').update({ deleted: true }).eq('user_id', uid).eq('id', id); if (error) throw new Error(error.message); }

/* ---------- what Claude may see and change (Settings › Claude) ---------- */
export function areaOf(r, ctx) {
  if (!r) return null; if (r.kind === 'entry') return r.hub || null; if (r.area) return r.area;
  const p = r.part && ctx.byId.get(r.part); if (p && p !== r) return areaOf(p, ctx); return null;
}
export function access(ctx, r) {
  const A = ctx.settings.claudeAccess || {}; const a = areaOf(r, ctx); const lvl = (a && A.areas && A.areas[a]) || 'write';
  if (A.off) return 'none'; if (A.mode === 'read' && lvl === 'write') return 'read'; return lvl;
}
export const canRead = (ctx, r) => access(ctx, r) !== 'none';
export const canWrite = (ctx, r) => access(ctx, r) === 'write';
export function guard(ctx, r, what) { if (!canWrite(ctx, r)) { const a = areaOf(r, ctx); throw Object.assign(new Error(`Life OS settings don’t let Claude ${what}${a ? ` in ${a}` : ''}. The owner can change this in Settings › Claude.`), { user: true }); } }

/* every change, logged with what it replaced, so the app can undo it */
export async function logChange(db, uid, ctx, what, rec, old) {
  const id = newId('cl');
  await saveRec(db, uid, { id, kind: 'claudelog', at: Date.now(), what, target: rec ? rec.id : null, old: old === undefined ? null : old, created: old === undefined, via: ctx.via || 'Claude' });
}

/* ---------- the day, the way the app builds it (simplified) ---------- */
export function dayView(ctx, dk) {
  const ok = r => canRead(ctx, r);
  const tasks = ctx.of('task').filter(t => !t.archived && ok(t));
  const onDay = tasks.filter(t => occurs(t.date, t.repeat, dk, t.skip)).map(t => ({ id: t.id, title: t.title, time: fmtT(t.time), minutes: t.dur || null, area: areaOf(t, ctx), priority: t.priority || 'normal', done: isDoneOn(t, dk), project: t.part && ctx.byId.get(t.part) ? ctx.byId.get(t.part).title : null, steps: (t.steps || []).length ? `${t.steps.filter(s => s.d).length} of ${t.steps.length} steps` : null }));
  const events = ctx.of('block').filter(b => ok(b) && occurs(b.date, b.repeat, dk, b.skip)).map(b => ({ id: b.id, title: b.title, start: fmtT(b.start), end: fmtT((b.start || 0) + (b.dur || 30)), place: b.place || null, notes: b.notes ? String(b.notes).slice(0, 300) : null })).sort((a, b) => (parseT(a.start) || 0) - (parseT(b.start) || 0));
  const allDay = ctx.of('allday').filter(r => ok(r) && (() => { const span = r.end ? between(r.start, r.end) : 0; for (let i = 0; i <= span; i++) if (occurs(r.start, r.repeat, addK(dk, -i), r.skip)) return true; return false; })()).map(r => ({ id: r.id, title: r.title }));
  const habits = ctx.of('habit').filter(h => ok(h) && habitDue(h, dk)).map(h => ({ id: h.id, title: h.title, done: habitDone(h, dk), schedule: habitWeekly(h) ? `${h.target || 1} a week` : 'on set days' }));
  const top = ((ctx.settings.top3 || {})[dk] || []).map(x => ctx.byId.get(x.id)).filter(Boolean).filter(ok).map(t => ({ id: t.id, title: t.title, done: isDoneOn(t, dk) }));
  return { date: dk, weekday: DOWN[monIdx(dk)], priorities: top, tasks: onDay.sort((a, b) => (parseT(a.time) ?? 9999) - (parseT(b.time) ?? 9999)), events, allDay, habits };
}
export function overdue(ctx, tk) { return ctx.of('task').filter(t => canRead(ctx, t) && !t.archived && t.date && t.date < tk && (!t.repeat || t.repeat.type === 'never') && !isDoneOn(t, t.date)).map(t => ({ id: t.id, title: t.title, from: t.date, moved: t.slips || 0 })); }
export const compact = o => JSON.parse(JSON.stringify(o, (k, v) => (v === null || v === undefined || (Array.isArray(v) && !v.length) ? undefined : v)));
