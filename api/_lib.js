// Shared server helpers. Files starting with _ are not web addresses.
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export const admin = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

export async function userFrom(req) {
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!tok) return null;
  const { data, error } = await admin().auth.getUser(tok);
  return error ? null : data.user;
}

let vapidSet = false;
function vapid() {
  if (vapidSet) return true;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:owner@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  return (vapidSet = true);
}

// sends one notification to every device a person turned notifications on for; forgets devices that are gone
export async function pushTo(db, userId, payload) {
  if (!vapid()) throw new Error('VAPID keys are not set');
  const { data: subs } = await db.from('push_subs').select('endpoint,sub').eq('user_id', userId);
  let sent = 0;
  await Promise.all((subs || []).map(async s => {
    try { await webpush.sendNotification(s.sub, JSON.stringify(payload), { TTL: 3600, urgency: 'high' }); sent++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await db.from('push_subs').delete().eq('endpoint', s.endpoint); else console.warn('push failed', e.statusCode, e.body); }
  }));
  return sent;
}
