// Read-only calendar import: fetches a private calendar link (Google, iCloud, Outlook) for a signed-in person.
// Only https/webcal links to public hosts, only text/calendar content, size-capped, and never stored on the server.
import { userFrom } from './_lib.js';
import { lookup } from 'node:dns/promises';
import net from 'node:net';

const MAX = 5_000_000;

export function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return privateIp(v.slice(7));
  return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
}

export async function safeUrl(raw) {
  let url;
  try { url = new URL(raw); } catch (e) { return null; }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  if (url.port && url.port !== '443') return null;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) || /^localhost$/i.test(host) || !host.includes('.')) return null;
  try {
    const addrs = await lookup(host, { all: true });
    if (!addrs.length || addrs.some(a => privateIp(a.address))) return null;
  } catch (e) { return null; }
  return url;
}

export default async function handler(req, res) {
  const user = await userFrom(req);
  if (!user) return res.status(401).json({ error: 'Sign in first' });
  const raw = String((req.query && req.query.u) || '').trim().replace(/^webcal:\/\//i, 'https://');
  if (!/^https:\/\//i.test(raw)) return res.status(400).json({ error: 'Calendar links must start with https or webcal' });
  let url = await safeUrl(raw);
  if (!url) return res.status(400).json({ error: 'That isn’t a calendar link' });
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 10000);
  try {
    let r;
    // follow up to 3 redirects by hand so every hop is checked
    for (let hop = 0; ; hop++) {
      r = await fetch(url.toString(), { signal: ctl.signal, redirect: 'manual', headers: { accept: 'text/calendar,*/*' } });
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
        if (hop >= 3) return res.status(502).json({ error: 'That link redirects too many times' });
        url = await safeUrl(new URL(r.headers.get('location'), url).toString());
        if (!url) return res.status(400).json({ error: 'That isn’t a calendar link' });
        continue;
      }
      break;
    }
    if (!r.ok) return res.status(502).json({ error: `The calendar answered ${r.status}` });
    if (+(r.headers.get('content-length') || 0) > MAX) return res.status(413).json({ error: 'That calendar is too large' });
    // read with a hard cap
    const reader = r.body.getReader(), chunks = []; let n = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; n += value.length; if (n > MAX) { ctl.abort(); return res.status(413).json({ error: 'That calendar is too large' }); } chunks.push(value); }
    const text = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8');
    if (!/BEGIN:VCALENDAR/.test(text)) return res.status(422).json({ error: 'That link isn’t a calendar feed' });
    res.setHeader('cache-control', 'private, no-store');
    res.setHeader('content-type', 'text/calendar; charset=utf-8');
    return res.status(200).send(text);
  } catch (e) {
    return res.status(504).json({ error: 'The calendar didn’t answer in time' });
  } finally { clearTimeout(t); }
}
