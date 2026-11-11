-- Sends due reminders every minute. Run this AFTER the app is live on Vercel.
-- Replace the two values in CAPITALS first: your app's address, and the CRON_SECRET you set in Vercel.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('lifeos-reminders') where exists (select 1 from cron.job where jobname = 'lifeos-reminders');
select cron.schedule('lifeos-reminders', '* * * * *', $$
  select net.http_post(
    url := 'https://YOUR-APP.vercel.app/api/push-tick',
    headers := jsonb_build_object('authorization', 'Bearer YOUR_CRON_SECRET', 'content-type', 'application/json'),
    body := '{}'::jsonb, timeout_milliseconds := 20000);
$$);
