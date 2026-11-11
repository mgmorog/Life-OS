// Lets the home-screen app ask Claude (Sort this for me, and more later). Off unless CLAUDE_ON=1 and ANTHROPIC_API_KEY are set.
import { userFrom } from './_lib.js';

export const config = { maxDuration: 60 };
const loose = t => { const m = String(t || '').match(/\{[\s\S]*\}|\[[\s\S]*\]/); if (!m) throw Object.assign(new Error('invalid_json'), { code: 'invalid_json' }); return JSON.parse(m[0]); };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (process.env.CLAUDE_ON !== '1' || !process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'Claude is off', code: 'capability_removed' });
  const user = await userFrom(req); if (!user) return res.status(401).json({ error: 'sign in again' });
  const { prompt, images = [], json = false, quick = false } = req.body || {};
  if (!prompt || String(prompt).length > 20000) return res.status(400).json({ error: 'bad prompt', code: 'invalid_request' });
  const content = [
    ...images.slice(0, 3).map(d => { const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(d || ''); return m && { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } }; }).filter(Boolean),
    { type: 'text', text: json ? `${prompt}\n\nReply with only the JSON.` : prompt },
  ];
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: quick ? (process.env.CLAUDE_QUICK_MODEL || 'claude-haiku-5-5') : (process.env.CLAUDE_MODEL || 'claude-sonnet-5-5'), max_tokens: 2000, messages: [{ role: 'user', content }] }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: (body.error && body.error.message) || 'Claude request failed', code: r.status === 429 ? 'rate_limited' : 'unknown' });
  const text = (body.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  if (!text) return res.status(502).json({ error: 'empty', code: 'empty_completion' });
  if (!json) return res.status(200).json({ text });
  try { return res.status(200).json({ json: loose(text) }); } catch (e) { return res.status(502).json({ error: 'unclear answer', code: 'invalid_json' }); }
}
