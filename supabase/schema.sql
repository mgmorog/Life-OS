-- Life OS database. Paste all of this into Supabase › SQL Editor › New query, then Run. Safe to run again.

-- Every item in the app is one row: your user id, the item id, and the item itself.
create table if not exists public.records (
  user_id    uuid   not null references auth.users(id) on delete cascade,
  id         text   not null,
  data       jsonb  not null default '{}'::jsonb,
  deleted    boolean not null default false,
  updated_at bigint not null default (extract(epoch from clock_timestamp()) * 1000)::bigint,
  primary key (user_id, id)
);
create index if not exists records_user_updated on public.records (user_id, updated_at);

-- the server stamps every change, so devices with wrong clocks still sync in order
create or replace function public.records_stamp() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := (extract(epoch from clock_timestamp()) * 1000)::bigint; return new; end $$;
drop trigger if exists records_stamp on public.records;
create trigger records_stamp before insert or update on public.records for each row execute function public.records_stamp();

alter table public.records enable row level security;
drop policy if exists "own records" on public.records;
create policy "own records" on public.records for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- live updates between your devices
do $$ begin
  alter publication supabase_realtime add table public.records;
exception when duplicate_object then null; end $$;

-- Push notification subscriptions, one per device
create table if not exists public.push_subs (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  sub        jsonb not null,
  ua         text,
  created_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
drop policy if exists "own subs" on public.push_subs;
create policy "own subs" on public.push_subs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Upcoming reminders, written by the app, sent by the server when due
create table if not exists public.reminders (
  user_id uuid not null references auth.users(id) on delete cascade,
  key     text not null,
  fire_at timestamptz not null,
  title   text not null,
  body    text,
  url     text,
  sent_at timestamptz,
  primary key (user_id, key)
);
create index if not exists reminders_due on public.reminders (fire_at) where sent_at is null;
alter table public.reminders enable row level security;
drop policy if exists "own reminders" on public.reminders;
create policy "own reminders" on public.reminders for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- replaces your schedule in one step; a reminder already sent stays sent unless its time changed
create or replace function public.set_reminders(items jsonb) returns void language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.reminders r where r.user_id = auth.uid()
    and not exists (select 1 from jsonb_array_elements(items) x where x->>'key' = r.key);
  insert into public.reminders (user_id, key, fire_at, title, body, url)
  select auth.uid(), x->>'key', (x->>'fire_at')::timestamptz, left(x->>'title', 200), left(x->>'body', 300), x->>'url'
  from jsonb_array_elements(items) x
  on conflict (user_id, key) do update set
    title = excluded.title, body = excluded.body, url = excluded.url, fire_at = excluded.fire_at,
    sent_at = case when public.reminders.fire_at = excluded.fire_at then public.reminders.sent_at else null end;
end $$;

-- The private calendar feed for your iPhone (read by the server with the secret link)
create table if not exists public.cal_feeds (
  token      text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  ics        text not null,
  updated_at timestamptz not null default now()
);
alter table public.cal_feeds enable row level security;
drop policy if exists "own feeds" on public.cal_feeds;
create policy "own feeds" on public.cal_feeds for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Photos: a private bucket; each person can only reach their own folder
insert into storage.buckets (id, name, public, file_size_limit)
values ('photos', 'photos', false, 10485760) on conflict (id) do nothing;
drop policy if exists "own photos read" on storage.objects;
drop policy if exists "own photos write" on storage.objects;
drop policy if exists "own photos delete" on storage.objects;
create policy "own photos read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos write" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
