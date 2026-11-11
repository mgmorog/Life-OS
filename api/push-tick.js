// Called every minute by Supabase (see supabase/cron.sql). Sends reminders that are due.
import { admin, pushTo } from './_lib.js';

export default async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'unauthorized' });
  const db = admin(), now = Date.now();
  // claim what is due (marking it sent first means two overlapping runs never double-send)
  const { data: due, error } = await db.from('reminders').update({ sent_at: new Date(now).toISOString() })
    .is('sent_at', null).lte('fire_at', new Date(now + 30e3).toISOString()).gt('fire_at', new Date(now - 60 * 60e3).toISOString())
    .select('user_id,key,title,body,url');
  if (error) return res.status(500).json({ error: error.message });
  let sent = 0;
  for (const r of due || []) sent += await pushTo(db, r.user_id, { title: r.title, body: r.body || '', tag: r.key, url: r.url || '/#today' }).catch(() => 0);
  res.status(200).json({ due: (due || []).length, sent });
}
