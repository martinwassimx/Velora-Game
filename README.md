# مهام مارو جيصه

Egyptian Arabic daily-task game. Players submit tasks, admins approve them, and the server grants XP, coins, streaks, and achievements. The browser never decides rewards, roles, bans, or approvals.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and Storage
- Ready for Vercel

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the whole file:

`supabase/migrations/001_initial.sql`

That file creates tables, indexes, RLS, storage buckets, storage policies, and the server functions that grant rewards.

3. In **Authentication → Providers**, keep Email enabled.
4. For local testing you can turn off **Confirm email**. If you leave it on, new users must open the confirmation message before they can sign in.
5. In **Authentication → URL Configuration**, set:
   - Site URL: `http://localhost:3000` (and your Vercel domain later)
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `https://YOUR-DOMAIN/auth/callback`

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It is used to delete auth users. Do not put it in any `NEXT_PUBLIC_` variable and do not import it from client components.

Find the values in Supabase: **Project Settings → API**.

## 3. Make yourself admin

Register in the app, then run this in the SQL editor with your email:

```sql
select set_config('app.trusted_write', 'on', true);

update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

Open `/admin` after you sign in again.

## 4. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Deploy on Vercel

1. Push the repo and import it in Vercel.
2. Add the same environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your public `https://` URL
3. Add that URL and `https://YOUR-DOMAIN/auth/callback` in Supabase Auth URL configuration.
4. Deploy. The production build command is `npm run build`.

## What the database enforces

- XP, coins, level, streak, and completed-task counts change only inside security-definer functions.
- A direct profile update can change username and avatar only.
- Task rewards are copied from the task row at approval time, and `reward_granted` stops a second payout.
- Daily login rewards are unique per user per Cairo calendar day.
- Admins cannot approve their own submission.
- Banned users are blocked in the proxy and inside the reward functions.
- Leaderboard rows expose username, level, XP, coins, streak, and completed tasks only.

## Routes

Public: `/login`, `/register`, `/forgot-password`

Player: `/`, `/tasks`, `/tasks/[id]`, `/submissions`, `/leaderboard`, `/profile`, `/achievements`, `/notifications`

Admin: `/admin`, `/admin/users`, `/admin/users/[id]`, `/admin/tasks`, `/admin/tasks/create`, `/admin/tasks/[id]`, `/admin/submissions`, `/admin/notifications`, `/admin/achievements`, `/admin/settings`, `/admin/logs`
