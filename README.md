# Velora
### Daily Mission Game — XP, Coins, Streaks, and Admin Review

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ecf8e?style=for-the-badge&logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-Ready-black?style=for-the-badge&logo=vercel)

> A daily mission game where players finish tasks, earn XP and coins, keep a streak, and climb a leaderboard. Admins review every submission. A new mission is published automatically every **24 hours**.

---

# 📌 Project Overview

Velora is a full-stack web game built as a portfolio project. Players sign in, complete missions, and get rewarded only after an admin approves the work. The browser never decides XP, coins, level, role, bans, or approvals.

The system is built for:

- Daily habit missions
- Player progression with XP, coins, levels, and streaks
- Admin review of photo and text submissions
- Automatic mission publishing
- A phone home-screen install

### 🏆 Core loop

| Step | What happens |
|---|---|
| A mission goes live | One new mission every 24 hours, or one an admin publishes |
| The player submits | A note, and a photo when the mission requires it |
| An admin reviews | Approve or reject, with optional bonus XP and coins |
| Rewards are granted | XP, coins, streak, and achievements update on the server |

---

# 🗂 What the game includes

- Home dashboard with level, XP, coins, and streak
- Mission list and mission page
- Photo submissions up to 5 MB (JPG, PNG, WEBP)
- First-player bonus coins
- First-player-only missions
- Daily login coin calendar
- Achievements
- Leaderboard
- Notifications
- Coin reward catalog, with a coming-soon switch
- Admin dashboard for users, missions, reviews, rewards, and logs
- Phone install prompt for iPhone and Android

---

# 🧠 Game systems

| System | How it works |
|---|---|
| Missions | Easy, Medium, Hard, or Legendary, with XP, coins, and a deadline |
| Auto mission | A 16-mission rotation publishes one task every 24 hours |
| First submit | The first player can earn extra coins set by the admin |
| First only | A mission can close after the first submission |
| Review | Approve or reject, including the admin's own submission |
| Bonus | Optional extra XP and coins on approval |
| Daily login | Coins for each day of a 7-day login cycle |
| Rewards shop | Catalog of coin rewards. Closed while "coming soon" is on |
| Security | Rewards are written only by server functions, not the browser |

### Default mission rewards

| Difficulty | XP | Coins |
|---|---|---|
| Easy | 25 | 10 |
| Medium | 50 | 25 |
| Hard | 100 | 50 |
| Legendary | 200 | 100 |

### Achievements

| Achievement | Requirement |
|---|---|
| First mission | 1 completed mission |
| Ten missions | 10 completed missions |
| Fifty missions | 50 completed missions |
| Seven-day streak | Longest streak of 7 |
| Streak legend | Longest streak of 30 |
| Level 10 | Reach level 10 |
| Coin collector | Earn 500 coins |

---

# 📂 Project Structure

```bash
velora/

├── src/app
│   ├── (auth)                 login, register, password reset
│   ├── (game)                 home, missions, rewards, ranks, profile
│   ├── admin                  dashboard and management
│   ├── api/daily-mission      24-hour mission publisher
│   └── auth/callback
│
├── src/components             shells, forms, icons
├── src/lib                    auth, actions, missions, rewards
├── supabase/migrations        schema, security, storage
├── public                     brand mark, PWA icons, service worker
├── vercel.json                hourly cron
└── README.md
```

---

# 🚀 Quick Start

## 1️⃣ Clone Repository

```bash
git clone https://github.com/martinwassimx/Velora-Game.git
cd Velora-Game
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Connect Supabase

Create a project at [supabase.com](https://supabase.com), then run `supabase/migrations/001_initial.sql` in the SQL editor.

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

In Supabase Auth, add `http://localhost:3000/auth/callback` as a redirect URL.

---

## 4️⃣ Run the App

```bash
npm run dev
```

---

## 5️⃣ Open Velora

```bash
http://localhost:3000
```

Register, then make that account an admin:

```sql
select set_config('app.trusted_write', 'on', true);

update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

Sign in again and open `/admin`.

---

# 📸 Player Features

- Sign up, sign in, and reset a password
- Today's mission, XP bar, coins, and streak
- Submit an answer and a photo
- Daily login rewards
- Achievements and notifications
- Leaderboard by XP, missions, coins, or streak
- Reward catalog
- Add to the home screen on a phone

---

# 🛠 Admin Features

- User list, roles, suspensions, and password reset
- Create, edit, duplicate, and delete missions
- Assign a mission to everyone or to specific players
- Review queue with approve and reject
- Bonus XP and bonus coins on a good answer
- Reward cards with photos
- Achievement editor
- Notification sender
- Settings and activity log

---

# ⚙️ Tech Stack

| Technology | Usage |
|---|---|
| Next.js 16 | App Router, server actions, API route |
| React 19 | Interface |
| TypeScript | Types across the app |
| Tailwind CSS 4 | Layout and styling |
| Supabase Auth | Accounts and sessions |
| Supabase Postgres | Players, missions, rewards, security rules |
| Supabase Storage | Avatars, mission photos, reward images |
| Vercel | Hosting and the hourly mission check |

---

# 📈 Game Numbers

| Item | Value |
|---|---|
| Auto mission cycle | Every 24 hours |
| Mission rotation | 16 missions |
| Difficulties | 4 |
| Login reward days | 7 |
| Achievements | 7 |
| Mission photo limit | 5 MB |
| Avatar limit | 2 MB |

---

# 🌍 What this project shows

- A full player and admin product, not a single page
- Server-side rewards so players cannot edit their own XP or coins
- File uploads for mission proof and reward photos
- A scheduled job that publishes content without a person creating it
- A phone install flow for iPhone and Android
- Auth, roles, reviews, and an activity log
