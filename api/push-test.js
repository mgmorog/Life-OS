// "Send a test notification" in Settings.
import { admin, userFrom, pushTo } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const user = await userFrom(req); if (!user) return res.status(401).json({ error: 'sign in again' });
  try { const sent = await pushTo(admin(), user.id, { title: 'Life OS', body: 'Notifications are working.', tag: 'test', url: '/#today' }); res.status(sent ? 200 : 404).json({ sent }); }
  catch (e) { res.status(500).json({ error: e.message }); }
}
