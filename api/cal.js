// The private calendar feed: /cal/<secret>.ics (Apple Calendar refreshes it on its own schedule).
import { admin } from './_lib.js';

export default async function handler(req, res) {
  const token = String(req.query.token || '').replace(/\.ics$/, '');
  if (!/^[0-9a-f]{24,64}$/.test(token)) return res.status(404).send('Not found');
  const { data } = await admin().from('cal_feeds').select('ics').eq('token', token).maybeSingle();
  if (!data) return res.status(404).send('Not found');
  res.setHeader('content-type', 'text/calendar; charset=utf-8');
  res.setHeader('cache-control', 'private, max-age=300');
  res.setHeader('content-disposition', 'inline; filename="life-os.ics"');
  res.status(200).send(data.ics);
}
