// Passes a sign-in from Safari (where the email link opens) to the Home Screen app.
// The app made a one-time secret id and put it in the link; only it can collect the result, once, within 15 minutes.
import { admin, userFrom } from './_lib.js';

export default async function handler(req, res) {
  const db = admin();
  if (req.method === 'POST') {
    const user = await userFrom(req); if (!user) return res.status(401).json({ error: 'sign in again' });
    const { id, refresh_token } = req.body || {};
    if (!/^[0-9a-f]{40}$/.test(id || '') || !refresh_token) return res.status(400).json({ error: 'bad request' });
    const { error } = await db.from('handoffs').upsert({ id, user_id: user.id, refresh_token, created_at: new Date().toISOString() }, { onConflict: 'id' });
    return error ? res.status(500).json({ error: error.message }) : res.status(200).json({ ok: true });
  }
  const id = String(req.query.id || '');
  if (!/^[0-9a-f]{40}$/.test(id)) return res.status(404).end();
  res.setHeader('cache-control', 'no-store');
  const { data } = await db.from('handoffs').delete().eq('id', id).gt('created_at', new Date(Date.now() - 15 * 60e3).toISOString()).select('refresh_token');
  if (!data || !data.length) return res.status(204).end();
  res.status(200).json({ refresh_token: data[0].refresh_token });
}
