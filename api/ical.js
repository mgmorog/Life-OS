// Read-only calendar import: fetches a private calendar link (Google, iCloud, Outlook) for a signed-in person.
// Only https/webcal links, only text/calendar content, size-capped, and never stored on the server.
import { userFrom } from './_lib.js';

export default async function handler(req, res) {
  const user = await userFrom(req);
  if (!user) return res.status(401).json({ error: 'Sign in first' });
  let u = String((req.query && req.query.u) || '').trim().replace(/^webcal:\/\//i, 'https://');
  let url;
  try { url = new URL(u); } catch (e) { return res.status(400).json({ error: 'That isn’t a calendar link' }); }
  if (url.protocol !== 'https:') return res.status(400).json({ error: 'Calendar links must start with https or webcal' });
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/i.test(url.hostname)) return res.status(400).json({ error: 'That isn’t a calendar link' });
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 10000);
    const r = await fetch(url.toString(), { signal: ctl.signal, redirect: 'follow', headers: { accept: 'text/calendar,*/*' } });
    clearTimeout(t);
    if (!r.ok) return res.status(502).json({ error: `The calendar answered ${r.status}` });
    const text = await r.text();
    if (text.length > 5_000_000) return res.status(413).json({ error: 'That calendar is too large' });
    if (!/BEGIN:VCALENDAR/.test(text)) return res.status(422).json({ error: 'That link isn’t a calendar feed' });
    res.setHeader('cache-control', 'private, no-store');
    res.setHeader('content-type', 'text/calendar; charset=utf-8');
    return res.status(200).send(text);
  } catch (e) { return res.status(504).json({ error: 'The calendar didn’t answer in time' }); }
}
