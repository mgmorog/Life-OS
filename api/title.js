// Link titles: for a signed-in person, reads the start of a public web page and returns its title, site name and icon.
// Same safety rules as the calendar reader: https, public hosts only, every redirect checked, size and time capped, nothing stored.
import { userFrom } from './_lib.js';
import { safeUrl } from './ical.js';

const MAX = 400_000;
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', middot: '·' };
export const decode = s => String(s || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
}).replace(/\s+/g, ' ').trim();
const attr = (tag, name) => { const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag); return m ? (m[2] ?? m[3] ?? m[4]) : null; };
export function parseMeta(html, base) {
  const head = html.slice(0, MAX);
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]);
  const meta = k => { for (const t of metas) { const p = (attr(t, 'property') || attr(t, 'name') || '').toLowerCase(); if (p === k) return attr(t, 'content'); } return null; };
  const tt = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head);
  let title = decode(meta('og:title') || meta('twitter:title') || (tt && tt[1]) || '');
  const site = decode(meta('og:site_name') || '');
  if (site && title.endsWith(` - ${site}`)) title = title.slice(0, -site.length - 3);
  if (site && title.endsWith(` | ${site}`)) title = title.slice(0, -site.length - 3);
  let icon = null;
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) { const rel = (attr(m[0], 'rel') || '').toLowerCase(); const href = attr(m[0], 'href'); if (!href) continue; if (rel.includes('apple-touch-icon')) { icon = href; break; } if (!icon && /\bicon\b/.test(rel)) icon = href; }
  try { icon = new URL(icon || '/favicon.ico', base).toString(); if (!icon.startsWith('https://')) icon = null; } catch (e) { icon = null; }
  return { title: title.slice(0, 200), site: site.slice(0, 80), icon };
}

/* v356 · recipe import: reads schema.org Recipe data (JSON-LD) from a public recipe page */
const isoMin = s => { const m = /P(?:T)?(?:(\d+)H)?(?:(\d+)M)?/i.exec(String(s || '')); return m ? (+(m[1] || 0)) * 60 + (+(m[2] || 0)) : null; };
const txt = x => typeof x === 'string' ? decode(x.replace(/<[^>]+>/g, ' ')) : x && x.text ? decode(String(x.text).replace(/<[^>]+>/g, ' ')) : '';
export function parseRecipe(html) {
  const found = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const j = JSON.parse(m[1].trim()); const walk = o => { if (!o) return; if (Array.isArray(o)) return o.forEach(walk); if (typeof o !== 'object') return; const t = o['@type']; if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) found.push(o); if (o['@graph']) walk(o['@graph']); }; walk(j); } catch (e) {}
  }
  const r = found[0]; if (!r) return null;
  const steps = []; const addStep = s => { if (!s) return; if (Array.isArray(s)) return s.forEach(addStep); if (s['@type'] === 'HowToSection') return addStep(s.itemListElement); const t = txt(s); if (t) steps.push(t); };
  addStep(r.recipeInstructions);
  const y = Array.isArray(r.recipeYield) ? r.recipeYield[0] : r.recipeYield;
  return { name: decode(r.name || '').slice(0, 160), ingredients: (r.recipeIngredient || []).map(x => decode(String(x))).filter(Boolean).slice(0, 60), steps: steps.slice(0, 40), min: isoMin(r.totalTime) || ((isoMin(r.prepTime) || 0) + (isoMin(r.cookTime) || 0)) || null, serves: parseInt(String(y || ''), 10) || null };
}
export default async function handler(req, res) {
  const user = await userFrom(req);
  if (!user) return res.status(401).json({ error: 'Sign in first' });
  const raw = String((req.query && req.query.u) || '').trim().replace(/^http:\/\//i, 'https://');
  let url = await safeUrl(raw);
  if (!url) return res.status(400).json({ error: 'Not a public https link' });
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 6000);
  try {
    let r;
    for (let hop = 0; ; hop++) {
      r = await fetch(url.toString(), { signal: ctl.signal, redirect: 'manual', headers: { accept: 'text/html,*/*;q=0.5', 'user-agent': 'Mozilla/5.0 (compatible; LifeOS link titles)' } });
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
        if (hop >= 4) return res.status(502).json({ error: 'Too many redirects' });
        url = await safeUrl(new URL(r.headers.get('location'), url).toString());
        if (!url) return res.status(400).json({ error: 'Not a public https link' });
        continue;
      }
      break;
    }
    if (!r.ok) return res.status(502).json({ error: `The page answered ${r.status}` });
    if (!/html/i.test(r.headers.get('content-type') || '')) return res.status(200).json({ title: '', site: '', icon: null });
    const reader = r.body.getReader(), chunks = []; let n = 0;
    const wantRecipe = !!(req.query && req.query.recipe), cap = wantRecipe ? 1_500_000 : MAX;
    for (;;) { const { done, value } = await reader.read(); if (done) break; n += value.length; chunks.push(value); if (n > cap || (!wantRecipe && /<\/head>/i.test(Buffer.from(value).toString('latin1')))) { ctl.abort(); break; } }
    const html = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8');
    res.setHeader('cache-control', 'private, max-age=86400');
    if (wantRecipe) { const rc = parseRecipe(html); return res.status(rc ? 200 : 404).json(rc || { error: 'No recipe found on that page' }); }
    return res.status(200).json(parseMeta(html, url));
  } catch (e) {
    return res.status(504).json({ error: 'The page didn’t answer in time' });
  } finally { clearTimeout(t); }
}
