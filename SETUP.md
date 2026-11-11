# Putting Life OS on your Home Screen

One-time setup, about 20 minutes. After this, every change pushed to GitHub goes live by itself, and the app on your phone picks it up the next time you open it.

You need three free accounts: **GitHub** (holds the code), **Supabase** (sign-in, your data, photos), **Vercel** (the web address the app runs at).

## 1. GitHub
Create an empty **private** repository called `life-os`. No README or licence. Claude pushes the code to it.

## 2. Supabase
1. New project `life-os`, Free plan, region East US. Save the database password somewhere safe; the app doesn't need it.
2. **SQL Editor › New query**: paste all of `supabase/schema.sql`, then **Run**.
3. **Authentication › URL Configuration** (after step 3 below): set **Site URL** to your Vercel address, and under **Redirect URLs** add your Vercel address followed by `/**` (for example `https://life-os-kohl-eight.vercel.app/**`). Sign-in emails contain a link; this lets the link hand the sign-in back to the Home Screen app.
5. **Project Settings › API**: you'll need the Project URL, the `anon` `public` key and the `service_role` key. The service_role key is a password: paste it only into Vercel, never into a chat.

## 3. Vercel
1. **Add New › Project**, import the `life-os` repository. Leave the build settings as they are (they come from `vercel.json`).
2. **Environment Variables** (all environments):

| Name | Value |
|---|---|
| `SUPABASE_URL` | Project URL from Supabase |
| `SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (secret) |
| `VAPID_PUBLIC_KEY` | from Claude |
| `VAPID_PRIVATE_KEY` | from Claude (secret) |
| `VAPID_SUBJECT` | `mailto:` + your email |
| `CRON_SECRET` | from Claude (secret) |
| `CLAUDE_ON` | `1` only if you add an Anthropic API key (optional) |
| `ANTHROPIC_API_KEY` | optional, powers “Sort this for me” in the home-screen app |

3. **Deploy**. Note the address, e.g. `life-os-yourname.vercel.app`.

## 4. Reminders timer
Supabase **SQL Editor**: paste `supabase/cron.sql`, replace `YOUR-APP.vercel.app` and `YOUR_CRON_SECRET`, then **Run**. This checks for due reminders every minute.

## 5. On your iPhone
1. Open the Vercel address in **Safari**, tap **Share › Add to Home Screen**.
2. Open Life OS from the Home Screen, enter your email, tap the link in the email (it opens Safari), then go back to Life OS. It signs in by itself.
3. In Supabase › **Authentication › Sign In / Providers**, turn off **Allow new users to sign up**, so only you can use it.
4. Move your data: in Life OS on claude.ai, **Settings › Data & recovery › Export with photos**. In the home-screen app, **Settings › Data & recovery › Restore from a backup**.
5. **Settings › Reviews & reminders › Notifications**: turn on reminders and allow them.
6. **Settings › Calendar & sync › Show Life OS in Apple Calendar**, then **Subscribe in Calendar**.

## Making changes later
Ask Claude for the change. Claude edits `src/`, runs the tests, and pushes to GitHub; Vercel publishes in about a minute. Open the app (or bring it back from the background) and it reloads into the new version, with a “What’s new” note on Today.
