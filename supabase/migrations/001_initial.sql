-- مهام مارو جيصه
-- Run this file once in the Supabase SQL editor (or via supabase db push).
-- It creates tables, RLS, storage, and the server-side game rules.
-- Rewards, roles, bans, and approvals are enforced here — never in the browser.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  email text not null,
  avatar_url text,
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  coins integer not null default 0 check (coins >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_streak_date date,
  total_completed_tasks integer not null default 0 check (total_completed_tasks >= 0),
  total_submitted_tasks integer not null default 0 check (total_submitted_tasks >= 0),
  total_xp_earned integer not null default 0 check (total_xp_earned >= 0),
  total_coins_earned integer not null default 0 check (total_coins_earned >= 0),
  role text not null default 'user' check (role in ('user', 'admin')),
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_len check (char_length(username) between 3 and 24)
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));
create index profiles_xp_idx on public.profiles (xp desc);
create index profiles_role_idx on public.profiles (role);

create table public.bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  banned_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint bans_reason_len check (char_length(reason) between 2 and 400)
);

create unique index bans_one_active_idx on public.bans (user_id) where is_active;
create index bans_user_idx on public.bans (user_id, created_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  instructions text not null default '',
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'legendary')),
  xp_reward integer not null default 0 check (xp_reward >= 0 and xp_reward <= 100000),
  coin_reward integer not null default 0 check (coin_reward >= 0 and coin_reward <= 100000),
  deadline timestamptz,
  requires_photo boolean not null default false,
  max_submissions integer not null default 1 check (max_submissions between 1 and 100),
  allow_resubmission boolean not null default false,
  is_active boolean not null default true,
  assign_to text not null default 'everyone' check (assign_to in ('everyone', 'specific')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_len check (char_length(title) between 2 and 120)
);

create index tasks_active_idx on public.tasks (is_active, created_at desc);
create index tasks_deadline_idx on public.tasks (deadline);

create table public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create index task_assignments_user_idx on public.task_assignments (user_id);

create table public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  photo_url text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  reward_granted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_submissions_reward_state check (reward_granted = false or status = 'approved'),
  constraint task_submissions_note_len check (note is null or char_length(note) <= 500)
);

create index task_submissions_user_idx on public.task_submissions (user_id, created_at desc);
create index task_submissions_status_idx on public.task_submissions (status, created_at desc);
create unique index task_submissions_one_pending_idx
  on public.task_submissions (user_id, task_id)
  where status = 'pending';

create table public.daily_login_rewards (
  day_number integer primary key check (day_number between 1 and 7),
  coins integer not null check (coins >= 0 and coins <= 1000000)
);

create table public.user_daily_logins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  login_date date not null,
  coins_awarded integer not null check (coins_awarded >= 0),
  streak_day integer not null check (streak_day >= 1),
  created_at timestamptz not null default now(),
  unique (user_id, login_date)
);

create index user_daily_logins_user_idx on public.user_daily_logins (user_id, login_date desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  type text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_title_len check (char_length(title) between 1 and 120),
  constraint notifications_body_len check (char_length(body) between 1 and 500)
);

create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon text not null default '🏆',
  condition_type text not null check (condition_type in ('completed_tasks', 'streak', 'level', 'coins', 'xp')),
  condition_value integer not null check (condition_value >= 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create index user_achievements_user_idx on public.user_achievements (user_id, unlocked_at desc);

create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_logs_created_idx on public.admin_logs (created_at desc);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------

insert into public.settings (key, value) values
  ('leaderboard_enabled', 'true'::jsonb),
  ('streak_reset_on_miss', 'true'::jsonb),
  ('timezone', '"Africa/Cairo"'::jsonb),
  ('level_thresholds', '[0, 100, 250, 500, 850, 1300, 1850, 2500, 3300, 4200, 5200]'::jsonb),
  ('difficulty_defaults', '{
    "easy": {"xp": 25, "coins": 10},
    "medium": {"xp": 50, "coins": 25},
    "hard": {"xp": 100, "coins": 50},
    "legendary": {"xp": 200, "coins": 100}
  }'::jsonb),
  ('rewards_coming_soon', 'true'::jsonb),
  ('redeem_rewards', '[]'::jsonb);

insert into public.daily_login_rewards (day_number, coins) values
  (1, 10),
  (2, 15),
  (3, 20),
  (4, 25),
  (5, 30),
  (6, 40),
  (7, 100);

insert into public.achievements (slug, title, description, icon, condition_type, condition_value) values
  ('first_task', 'أول مهمة', 'خلّصت أول مهمة ليك', '🏆', 'completed_tasks', 1),
  ('streak_7', '7 أيام متواصل', 'وصلت لستريك 7 أيام', '🔥', 'streak', 7),
  ('tasks_10', '10 مهام', 'خلّصت 10 مهام', '⚡', 'completed_tasks', 10),
  ('tasks_50', '50 مهمة', 'خلّصت 50 مهمة', '💎', 'completed_tasks', 50),
  ('level_10', 'Level 10', 'وصلت للمستوى 10', '👑', 'level', 10),
  ('coins_500', 'جامع الكوينز', 'جمعت 500 كوين', '🪙', 'coins', 500),
  ('streak_30', 'أسطورة الاستمرار', 'وصلت لستريك 30 يوم', '🌟', 'streak', 30);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create trigger submissions_set_updated_at
before update on public.task_submissions
for each row execute function public.set_updated_at();

create or replace function public.protect_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('app.trusted_write', true) = 'on' then
    new.updated_at = now();
    return new;
  end if;

  if auth.uid() is distinct from old.id then
    raise exception 'مش مسموح تعدل بروفايل حد تاني';
  end if;

  if new.username is null or char_length(trim(new.username)) < 3 or char_length(trim(new.username)) > 24 then
    raise exception 'اسم المستخدم لازم يكون من 3 لـ 24 حرف';
  end if;

  if new.username ~ '[<>]' then
    raise exception 'اسم المستخدم فيه رموز مش مسموحة';
  end if;

  new.username = trim(new.username);

  if new.avatar_url is not null and length(trim(new.avatar_url)) = 0 then
    new.avatar_url = null;
  end if;

  if new.avatar_url is not null and (
    new.avatar_url !~ '^[0-9a-fA-F-]+/[A-Za-z0-9._-]+$'
    or split_part(new.avatar_url, '/', 1) is distinct from auth.uid()::text
  ) then
    raise exception 'صورة البروفايل مش صحيحة';
  end if;

  new.id = old.id;
  new.email = old.email;
  new.xp = old.xp;
  new.level = old.level;
  new.coins = old.coins;
  new.current_streak = old.current_streak;
  new.longest_streak = old.longest_streak;
  new.last_streak_date = old.last_streak_date;
  new.total_completed_tasks = old.total_completed_tasks;
  new.total_submitted_tasks = old.total_submitted_tasks;
  new.total_xp_earned = old.total_xp_earned;
  new.total_coins_earned = old.total_coins_earned;
  new.role = old.role;
  new.last_login = old.last_login;
  new.created_at = old.created_at;
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_protect
before update on public.profiles
for each row execute function public.protect_profile();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_currently_banned(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bans
    where user_id = p_user
      and is_active
      and (expires_at is null or expires_at > now())
  );
$$;

create or replace function public.assert_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'لازم تسجل دخول';
  end if;
  if not public.is_admin() then
    raise exception 'مش مسموحلك بالعملية دي';
  end if;
  if public.is_currently_banned(auth.uid()) then
    raise exception 'الحساب بتاعك متوقف';
  end if;
end;
$$;

create or replace function public.app_timezone()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select nullif(value #>> '{}', '') from public.settings where key = 'timezone'),
    'Africa/Cairo'
  );
$$;

create or replace function public.app_today()
returns date
language sql
stable
security definer
set search_path = public
as $$
  select (now() at time zone public.app_timezone())::date;
$$;

create or replace function public.current_ban()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if auth.uid() is null then
    return null;
  end if;

  select jsonb_build_object(
    'reason', reason,
    'expires_at', expires_at,
    'permanent', expires_at is null
  )
  into v
  from public.bans
  where user_id = auth.uid()
    and is_active
    and (expires_at is null or expires_at > now())
  order by created_at desc
  limit 1;

  return v;
end;
$$;

create or replace function public.level_for_xp(p_xp integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_raw jsonb;
  v_thresholds integer[];
  v_len integer;
  v_i integer;
  v_level integer := 1;
  v_floor integer := 0;
  v_next integer;
  v_gap integer;
  v_req integer;
  v_prev integer;
  v_guard integer := 0;
begin
  if p_xp is null or p_xp < 0 then
    p_xp := 0;
  end if;

  select value into v_raw from public.settings where key = 'level_thresholds';

  if v_raw is null or jsonb_typeof(v_raw) <> 'array' then
    v_thresholds := array[0, 100, 250, 500, 850, 1300, 1850, 2500, 3300, 4200, 5200];
  else
    select coalesce(array_agg(value::integer order by ord), array[0]::integer[])
    into v_thresholds
    from jsonb_array_elements_text(v_raw) with ordinality as t(value, ord);
  end if;

  if v_thresholds[1] is distinct from 0 then
    v_thresholds := array[0] || v_thresholds;
  end if;

  v_len := coalesce(array_length(v_thresholds, 1), 1);

  for v_i in 1..v_len loop
    if p_xp >= v_thresholds[v_i] then
      v_level := v_i;
      v_floor := v_thresholds[v_i];
      if v_i < v_len then
        v_next := v_thresholds[v_i + 1];
      else
        v_next := null;
      end if;
    end if;
  end loop;

  if v_next is null then
    if v_len >= 2 then
      v_gap := greatest(v_thresholds[v_len] - v_thresholds[v_len - 1], 50);
    else
      v_gap := 100;
    end if;
    v_prev := v_thresholds[v_len];
    v_req := v_prev + v_gap;
    while p_xp >= v_req and v_guard < 200 and v_req < 2000000000 loop
      v_guard := v_guard + 1;
      v_level := v_level + 1;
      v_prev := v_req;
      v_gap := greatest(ceil(v_gap * 1.2)::integer, v_gap + 1);
      v_req := v_prev + v_gap;
    end loop;
    v_floor := v_prev;
    v_next := v_req;
  end if;

  return jsonb_build_object(
    'level', v_level,
    'floor_xp', v_floor,
    'next_xp', v_next,
    'xp', p_xp
  );
end;
$$;

create or replace function public.write_admin_log(
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_description text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'مش مسموحلك بالعملية دي';
  end if;

  insert into public.admin_logs (admin_id, action, target_type, target_id, description, metadata)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_description, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

create or replace function public.unlock_achievements(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_ach public.achievements%rowtype;
  v_rows integer;
begin
  select * into v_profile from public.profiles where id = p_user;
  if not found then
    return;
  end if;

  for v_ach in select * from public.achievements where is_active loop
    if (
      (v_ach.condition_type = 'completed_tasks' and v_profile.total_completed_tasks >= v_ach.condition_value)
      or (v_ach.condition_type = 'streak' and v_profile.longest_streak >= v_ach.condition_value)
      or (v_ach.condition_type = 'level' and v_profile.level >= v_ach.condition_value)
      or (v_ach.condition_type = 'coins' and v_profile.total_coins_earned >= v_ach.condition_value)
      or (v_ach.condition_type = 'xp' and v_profile.total_xp_earned >= v_ach.condition_value)
    ) then
      insert into public.user_achievements (user_id, achievement_id)
      values (p_user, v_ach.id)
      on conflict (user_id, achievement_id) do nothing;

      get diagnostics v_rows = row_count;
      if v_rows > 0 then
        insert into public.notifications (user_id, title, body, type)
        values (
          p_user,
          v_ach.icon || ' إنجاز جديد',
          'فتحت إنجاز: ' || v_ach.title,
          'achievement'
        );
      end if;
    end if;
  end loop;
end;
$$;

create or replace function public.apply_streak(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.app_today();
  v_current integer;
  v_longest integer;
  v_last date;
  v_new integer;
  v_reset boolean;
begin
  perform set_config('app.trusted_write', 'on', true);

  select current_streak, longest_streak, last_streak_date
  into v_current, v_longest, v_last
  from public.profiles
  where id = p_user
  for update;

  if v_last = v_today then
    return v_current;
  end if;

  select coalesce(value = 'true'::jsonb, true)
  into v_reset
  from public.settings
  where key = 'streak_reset_on_miss';

  if v_reset is null then
    v_reset := true;
  end if;

  if v_last is null then
    v_new := 1;
  elsif v_last = v_today - 1 then
    v_new := v_current + 1;
  elsif v_reset then
    v_new := 1;
  else
    v_new := v_current + 1;
  end if;

  update public.profiles
  set
    current_streak = v_new,
    longest_streak = greatest(v_longest, v_new),
    last_streak_date = v_today
  where id = p_user;

  if v_new in (7, 30) then
    insert into public.notifications (user_id, title, body, type)
    values (
      p_user,
      '🔥 الستريك',
      'وصلت لـ ' || v_new || ' أيام Streak!',
      'streak'
    );
  end if;

  return v_new;
end;
$$;

create or replace function public.grant_rewards(
  p_user uuid,
  p_xp integer,
  p_coins integer,
  p_increment_completed boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_level integer;
  v_new_level integer;
  v_xp integer;
  v_coins integer;
  v_progress jsonb;
begin
  if p_xp < 0 or p_coins < 0 then
    raise exception 'مكافأة غير صحيحة';
  end if;

  perform set_config('app.trusted_write', 'on', true);

  select level into v_old_level
  from public.profiles
  where id = p_user
  for update;

  if v_old_level is null then
    raise exception 'المستخدم مش موجود';
  end if;

  update public.profiles
  set
    xp = xp + p_xp,
    coins = coins + p_coins,
    total_xp_earned = total_xp_earned + p_xp,
    total_coins_earned = total_coins_earned + p_coins,
    total_completed_tasks = total_completed_tasks + case when p_increment_completed then 1 else 0 end
  where id = p_user
  returning xp, coins into v_xp, v_coins;

  v_progress := public.level_for_xp(v_xp);
  v_new_level := (v_progress->>'level')::integer;

  update public.profiles
  set level = v_new_level
  where id = p_user;

  perform public.apply_streak(p_user);
  perform public.unlock_achievements(p_user);

  if v_new_level > v_old_level then
    insert into public.notifications (user_id, title, body, type)
    values (
      p_user,
      '🎉 LEVEL UP!',
      'بقيت Level ' || v_new_level || ' 🔥',
      'level_up'
    );
  end if;

  return jsonb_build_object(
    'level_up', v_new_level > v_old_level,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'xp', v_xp,
    'coins', v_coins
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Auth profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_base text;
  v_try integer := 0;
begin
  v_base := trim(coalesce(new.raw_user_meta_data->>'username', ''));
  if char_length(v_base) < 3 or v_base ~ '[<>]' then
    v_base := left(regexp_replace(split_part(coalesce(new.email, 'player'), '@', 1), '[^[:alnum:]_ء-ي]', '', 'g'), 20);
  end if;
  if char_length(v_base) < 3 then
    v_base := 'player';
  end if;
  v_base := left(v_base, 20);
  v_username := v_base;

  while exists (select 1 from public.profiles where lower(username) = lower(v_username)) loop
    v_try := v_try + 1;
    v_username := left(v_base, 16) || v_try::text;
    if v_try > 50 then
      v_username := left(v_base, 12) || substr(replace(new.id::text, '-', ''), 1, 8);
      exit;
    end if;
  end loop;

  insert into public.profiles (id, username, email)
  values (new.id, v_username, coalesce(new.email, ''));

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    char_length(trim(coalesce(p_username, ''))) between 3 and 24
    and trim(p_username) !~ '[<>]'
    and not exists (
      select 1 from public.profiles where lower(username) = lower(trim(p_username))
    );
$$;

-- ---------------------------------------------------------------------------
-- Player actions
-- ---------------------------------------------------------------------------

create or replace function public.touch_session()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  perform set_config('app.trusted_write', 'on', true);
  update public.profiles
  set last_login = now()
  where id = auth.uid();
end;
$$;

create or replace function public.claim_daily_reward()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date;
  v_existing public.user_daily_logins%rowtype;
  v_streak integer;
  v_day integer;
  v_coins integer;
  v_inserted uuid;
begin
  if v_uid is null then
    raise exception 'لازم تسجل دخول';
  end if;
  if public.is_currently_banned(v_uid) then
    raise exception 'الحساب بتاعك متوقف';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_uid::text || ':daily')::bigint);
  v_today := public.app_today();

  select * into v_existing
  from public.user_daily_logins
  where user_id = v_uid and login_date = v_today;

  if found then
    return jsonb_build_object(
      'already', true,
      'coins', v_existing.coins_awarded,
      'streak', (select current_streak from public.profiles where id = v_uid),
      'day', v_existing.streak_day
    );
  end if;

  perform set_config('app.trusted_write', 'on', true);
  v_streak := public.apply_streak(v_uid);
  v_day := least(greatest(v_streak, 1), 7);

  select coins into v_coins
  from public.daily_login_rewards
  where day_number = v_day;

  if v_coins is null then
    raise exception 'مكافآت الدخول مش متظبطة';
  end if;

  insert into public.user_daily_logins (user_id, login_date, coins_awarded, streak_day)
  values (v_uid, v_today, v_coins, v_day)
  on conflict (user_id, login_date) do nothing
  returning id into v_inserted;

  if v_inserted is null then
    raise exception 'المكافأة اتاخدت قبل كده';
  end if;

  update public.profiles
  set
    coins = coins + v_coins,
    total_coins_earned = total_coins_earned + v_coins
  where id = v_uid;

  insert into public.notifications (user_id, title, body, type)
  values (
    v_uid,
    '🎁 مكافأة الدخول اليومية',
    'خدت ' || v_coins || ' كوين النهارده! الستريك: ' || v_streak || ' أيام',
    'daily_reward'
  );

  perform public.unlock_achievements(v_uid);

  return jsonb_build_object(
    'already', false,
    'coins', v_coins,
    'streak', v_streak,
    'day', v_day
  );
end;
$$;

create or replace function public.submit_task(
  p_task_id uuid,
  p_photo_path text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_task public.tasks%rowtype;
  v_pending integer;
  v_approved integer;
  v_count integer;
  v_id uuid;
  v_note text;
begin
  if v_uid is null then
    raise exception 'لازم تسجل دخول';
  end if;
  if public.is_currently_banned(v_uid) then
    raise exception 'الحساب بتاعك متوقف';
  end if;

  select * into v_task from public.tasks where id = p_task_id;
  if not found then
    raise exception 'المهمة مش موجودة';
  end if;
  if not v_task.is_active then
    raise exception 'المهمة مش متاحة دلوقتي';
  end if;
  if v_task.deadline is not null and v_task.deadline < now() then
    raise exception 'ميعاد المهمة خلّص';
  end if;
  if v_task.assign_to = 'specific' and not exists (
    select 1 from public.task_assignments
    where task_id = p_task_id and user_id = v_uid
  ) then
    raise exception 'المهمة دي مش بتاعتك';
  end if;

  if p_photo_path is not null and length(trim(p_photo_path)) = 0 then
    p_photo_path := null;
  end if;

  if v_task.requires_photo and p_photo_path is null then
    raise exception 'لازم ترفع صورة المهمة';
  end if;

  if p_photo_path is not null and (
    split_part(p_photo_path, '/', 1) is distinct from v_uid::text
    or p_photo_path like '%..%'
    or p_photo_path like '/%'
    or p_photo_path !~ '^[0-9a-fA-F-]+/[A-Za-z0-9._-]+$'
  ) then
    raise exception 'مسار الصورة مش صحيح';
  end if;

  v_note := nullif(trim(coalesce(p_note, '')), '');
  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'الملاحظة طويلة أوي';
  end if;

  select
    count(*) filter (where status = 'pending'),
    count(*) filter (where status = 'approved'),
    count(*)
  into v_pending, v_approved, v_count
  from public.task_submissions
  where user_id = v_uid and task_id = p_task_id;

  if v_pending > 0 then
    raise exception 'عندك طلب مستني المراجعة على المهمة دي';
  end if;
  if v_approved >= v_task.max_submissions then
    raise exception 'خلّصت المهمة دي قبل كده';
  end if;
  if v_count > 0 and not v_task.allow_resubmission and v_approved = 0 then
    raise exception 'مش مسموح تبعت المهمة دي تاني';
  end if;
  if v_count >= 20 then
    raise exception 'وصلت للحد الأقصى من المحاولات';
  end if;

  begin
    insert into public.task_submissions (user_id, task_id, photo_url, note, status)
    values (v_uid, p_task_id, p_photo_path, v_note, 'pending')
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'عندك طلب مستني المراجعة على المهمة دي';
  end;

  perform set_config('app.trusted_write', 'on', true);
  update public.profiles
  set total_submitted_tasks = total_submitted_tasks + 1
  where id = v_uid;

  insert into public.notifications (user_id, title, body, type)
  values (
    v_uid,
    'المهمة مستنية المراجعة',
    'بعتّ «' || v_task.title || '» وبانتظار موافقة الأدمن.',
    'submission_pending'
  );

  return v_id;
end;
$$;

create or replace function public.get_public_config()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'لازم تسجل دخول';
  end if;

  return jsonb_build_object(
    'leaderboard_enabled', coalesce((select value = 'true'::jsonb from public.settings where key = 'leaderboard_enabled'), true),
    'streak_reset_on_miss', coalesce((select value = 'true'::jsonb from public.settings where key = 'streak_reset_on_miss'), true),
    'timezone', public.app_timezone(),
    'level_thresholds', coalesce((select value from public.settings where key = 'level_thresholds'), '[0,100,250,500,850]'::jsonb),
    'daily_rewards', coalesce((
      select jsonb_agg(jsonb_build_object('day', day_number, 'coins', coins) order by day_number)
      from public.daily_login_rewards
    ), '[]'::jsonb),
    'difficulty_defaults', coalesce((select value from public.settings where key = 'difficulty_defaults'), '{}'::jsonb)
  );
end;
$$;

create or replace function public.get_leaderboard(p_sort text)
returns table (
  place bigint,
  user_id uuid,
  username text,
  avatar_url text,
  level integer,
  xp integer,
  coins integer,
  current_streak integer,
  total_completed_tasks integer,
  is_me boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
  v_sort text;
begin
  if auth.uid() is null then
    raise exception 'لازم تسجل دخول';
  end if;

  v_enabled := coalesce((select value = 'true'::jsonb from public.settings where key = 'leaderboard_enabled'), true);
  if not v_enabled and not public.is_admin() then
    return;
  end if;

  v_sort := case p_sort
    when 'completed' then 'completed'
    when 'coins' then 'coins'
    when 'streak' then 'streak'
    else 'xp'
  end;

  return query
  select
    row_number() over (
      order by
        case
          when v_sort = 'completed' then p.total_completed_tasks
          when v_sort = 'coins' then p.coins
          when v_sort = 'streak' then p.current_streak
          else p.xp
        end desc,
        p.xp desc,
        p.username asc
    ) as place,
    p.id,
    p.username,
    p.avatar_url,
    p.level,
    p.xp,
    p.coins,
    p.current_streak,
    p.total_completed_tasks,
    p.id = auth.uid()
  from public.profiles p
  where not public.is_currently_banned(p.id)
  limit 100;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin actions
-- ---------------------------------------------------------------------------

create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_signups jsonb;
  v_subs jsonb;
begin
  perform public.assert_admin();
  v_today := public.app_today();

  select coalesce(jsonb_agg(jsonb_build_object('date', day::text, 'count', cnt) order by day), '[]'::jsonb)
  into v_signups
  from (
    select d::date as day, count(p.id) as cnt
    from generate_series(v_today - 6, v_today, interval '1 day') d
    left join public.profiles p
      on (p.created_at at time zone public.app_timezone())::date = d::date
    group by d
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object(
    'date', day::text,
    'pending', pending,
    'approved', approved,
    'rejected', rejected
  ) order by day), '[]'::jsonb)
  into v_subs
  from (
    select
      d::date as day,
      count(ts.id) filter (where ts.status = 'pending') as pending,
      count(ts.id) filter (where ts.status = 'approved') as approved,
      count(ts.id) filter (where ts.status = 'rejected') as rejected
    from generate_series(v_today - 6, v_today, interval '1 day') d
    left join public.task_submissions ts
      on (ts.created_at at time zone public.app_timezone())::date = d::date
    group by d
  ) s;

  return jsonb_build_object(
    'total_users', (select count(*) from public.profiles),
    'active_users', (select count(*) from public.profiles where last_login >= now() - interval '7 days'),
    'banned_users', (
      select count(distinct user_id) from public.bans
      where is_active and (expires_at is null or expires_at > now())
    ),
    'tasks_today', (
      select count(*) from public.tasks
      where (created_at at time zone public.app_timezone())::date = v_today
    ),
    'pending_submissions', (select count(*) from public.task_submissions where status = 'pending'),
    'completed_tasks', (select count(*) from public.task_submissions where status = 'approved'),
    'total_xp', (select coalesce(sum(total_xp_earned), 0) from public.profiles),
    'total_coins', (select coalesce(sum(total_coins_earned), 0) from public.profiles),
    'signups', v_signups,
    'submissions', v_subs
  );
end;
$$;

create or replace function public.admin_save_task(
  p_id uuid,
  p_payload jsonb,
  p_user_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_title text;
  v_description text;
  v_instructions text;
  v_difficulty text;
  v_xp integer;
  v_coins integer;
  v_deadline timestamptz;
  v_photo boolean;
  v_max integer;
  v_resub boolean;
  v_active boolean;
  v_assign text;
  v_tz text;
begin
  perform public.assert_admin();

  v_title := trim(coalesce(p_payload->>'title', ''));
  v_description := coalesce(p_payload->>'description', '');
  v_instructions := coalesce(p_payload->>'instructions', '');
  v_difficulty := coalesce(p_payload->>'difficulty', '');
  v_assign := coalesce(p_payload->>'assign_to', 'everyone');

  if char_length(v_title) < 2 or char_length(v_title) > 120 then
    raise exception 'عنوان المهمة لازم يكون من حرفين لـ 120';
  end if;
  if char_length(v_description) > 2000 or char_length(v_instructions) > 4000 then
    raise exception 'وصف المهمة طويل أوي';
  end if;
  if v_difficulty not in ('easy', 'medium', 'hard', 'legendary') then
    raise exception 'اختار مستوى الصعوبة';
  end if;
  if coalesce(p_payload->>'xp_reward', '0') !~ '^[0-9]+$'
     or coalesce(p_payload->>'coin_reward', '0') !~ '^[0-9]+$' then
    raise exception 'المكافأة لازم تكون رقم';
  end if;

  v_xp := (p_payload->>'xp_reward')::integer;
  v_coins := (p_payload->>'coin_reward')::integer;
  if v_xp > 100000 or v_coins > 100000 then
    raise exception 'المكافأة أكبر من المسموح';
  end if;

  v_photo := coalesce((p_payload->>'requires_photo')::boolean, false);
  v_resub := coalesce((p_payload->>'allow_resubmission')::boolean, false);
  v_active := coalesce((p_payload->>'is_active')::boolean, true);

  if coalesce(p_payload->>'max_submissions', '1') !~ '^[0-9]+$' then
    raise exception 'عدد مرات التسليم مش صحيح';
  end if;
  v_max := (p_payload->>'max_submissions')::integer;
  if v_max < 1 or v_max > 100 then
    raise exception 'عدد مرات التسليم لازم يكون من 1 لـ 100';
  end if;

  if v_assign not in ('everyone', 'specific') then
    raise exception 'طريقة التعيين مش صحيحة';
  end if;

  v_tz := public.app_timezone();
  if nullif(p_payload->>'deadline', '') is null then
    v_deadline := null;
  else
    begin
      v_deadline := replace(p_payload->>'deadline', 'T', ' ')::timestamp at time zone v_tz;
    exception
      when others then
        raise exception 'ميعاد التسليم مش صحيح';
    end;
  end if;

  if v_assign = 'specific' and (p_user_ids is null or coalesce(array_length(p_user_ids, 1), 0) = 0) then
    raise exception 'اختار اللاعبين اللي هيستلموا المهمة';
  end if;

  if p_id is null then
    insert into public.tasks (
      title, description, instructions, difficulty, xp_reward, coin_reward,
      deadline, requires_photo, max_submissions, allow_resubmission, is_active,
      assign_to, created_by
    ) values (
      v_title, v_description, v_instructions, v_difficulty, v_xp, v_coins,
      v_deadline, v_photo, v_max, v_resub, v_active, v_assign, auth.uid()
    )
    returning id into v_id;

    perform public.write_admin_log('task_created', 'task', v_id, 'إنشاء مهمة: ' || v_title, p_payload);
  else
    update public.tasks
    set
      title = v_title,
      description = v_description,
      instructions = v_instructions,
      difficulty = v_difficulty,
      xp_reward = v_xp,
      coin_reward = v_coins,
      deadline = v_deadline,
      requires_photo = v_photo,
      max_submissions = v_max,
      allow_resubmission = v_resub,
      is_active = v_active,
      assign_to = v_assign
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'المهمة مش موجودة';
    end if;

    perform public.write_admin_log('task_updated', 'task', v_id, 'تعديل مهمة: ' || v_title, p_payload);
  end if;

  delete from public.task_assignments where task_id = v_id;
  if v_assign = 'specific' then
    insert into public.task_assignments (task_id, user_id)
    select v_id, u
    from unnest(p_user_ids) as u
    where exists (select 1 from public.profiles p where p.id = u);
  end if;

  return v_id;
end;
$$;

create or replace function public.admin_delete_task(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  perform public.assert_admin();
  select title into v_title from public.tasks where id = p_id;
  if v_title is null then
    raise exception 'المهمة مش موجودة';
  end if;
  perform public.write_admin_log('task_deleted', 'task', p_id, 'مسح مهمة: ' || v_title, '{}'::jsonb);
  delete from public.tasks where id = p_id;
end;
$$;

create or replace function public.admin_duplicate_task(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new uuid;
  v_task public.tasks%rowtype;
begin
  perform public.assert_admin();
  select * into v_task from public.tasks where id = p_id;
  if not found then
    raise exception 'المهمة مش موجودة';
  end if;

  insert into public.tasks (
    title, description, instructions, difficulty, xp_reward, coin_reward,
    deadline, requires_photo, max_submissions, allow_resubmission, is_active,
    assign_to, created_by
  ) values (
    left(v_task.title || ' (نسخة)', 120),
    v_task.description,
    v_task.instructions,
    v_task.difficulty,
    v_task.xp_reward,
    v_task.coin_reward,
    v_task.deadline,
    v_task.requires_photo,
    v_task.max_submissions,
    v_task.allow_resubmission,
    false,
    v_task.assign_to,
    auth.uid()
  )
  returning id into v_new;

  insert into public.task_assignments (task_id, user_id)
  select v_new, user_id from public.task_assignments where task_id = p_id;

  perform public.write_admin_log('task_duplicated', 'task', v_new, 'نسخ مهمة: ' || v_task.title, jsonb_build_object('source', p_id));
  return v_new;
end;
$$;

create or replace function public.admin_review_submission(
  p_id uuid,
  p_approve boolean,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.task_submissions%rowtype;
  v_task public.tasks%rowtype;
  v_updated uuid;
  v_reward jsonb;
  v_reason text;
begin
  perform public.assert_admin();

  select * into v_sub
  from public.task_submissions
  where id = p_id
  for update;

  if not found then
    raise exception 'الطلب مش موجود';
  end if;
  if v_sub.status <> 'pending' or v_sub.reward_granted then
    raise exception 'الطلب ده اتراجع قبل كده';
  end if;

  select * into v_task from public.tasks where id = v_sub.task_id;
  if not found then
    raise exception 'المهمة مش موجودة';
  end if;

  if p_approve then
    update public.task_submissions
    set
      status = 'approved',
      reward_granted = true,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      rejection_reason = null
    where id = p_id
      and status = 'pending'
      and reward_granted = false
    returning id into v_updated;

    if v_updated is null then
      raise exception 'الطلب ده اتراجع قبل كده';
    end if;

    v_reward := public.grant_rewards(v_sub.user_id, v_task.xp_reward, v_task.coin_reward, true);

    insert into public.notifications (user_id, title, body, type)
    values (
      v_sub.user_id,
      '✅ المهمة اتقبلت',
      'اتقبلت «' || v_task.title || '» وخدت ' || v_task.xp_reward || ' XP و ' || v_task.coin_reward || ' كوين.',
      'submission_approved'
    );

    perform public.write_admin_log(
      'submission_approved',
      'submission',
      p_id,
      'قبول مهمة: ' || v_task.title,
      jsonb_build_object('user_id', v_sub.user_id, 'xp', v_task.xp_reward, 'coins', v_task.coin_reward)
    );

    return v_reward || jsonb_build_object('status', 'approved');
  end if;

  v_reason := trim(coalesce(p_reason, ''));
  if char_length(v_reason) < 2 then
    raise exception 'اكتب سبب الرفض';
  end if;
  if char_length(v_reason) > 400 then
    raise exception 'سبب الرفض طويل أوي';
  end if;

  update public.task_submissions
  set
    status = 'rejected',
    reward_granted = false,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    rejection_reason = v_reason
  where id = p_id
    and status = 'pending'
    and reward_granted = false
  returning id into v_updated;

  if v_updated is null then
    raise exception 'الطلب ده اتراجع قبل كده';
  end if;

  insert into public.notifications (user_id, title, body, type)
  values (
    v_sub.user_id,
    '❌ المهمة اترفضت',
    'اترفضت «' || v_task.title || '». السبب: ' || v_reason,
    'submission_rejected'
  );

  perform public.write_admin_log(
    'submission_rejected',
    'submission',
    p_id,
    'رفض مهمة: ' || v_task.title,
    jsonb_build_object('user_id', v_sub.user_id, 'reason', v_reason)
  );

  return jsonb_build_object('status', 'rejected', 'level_up', false);
end;
$$;

create or replace function public.admin_adjust_xp(p_user uuid, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_xp integer;
  v_old integer;
  v_new integer;
  v_progress jsonb;
begin
  perform public.assert_admin();
  if p_delta = 0 or p_delta < -1000000 or p_delta > 1000000 then
    raise exception 'قيمة الـ XP مش مسموحة';
  end if;

  perform set_config('app.trusted_write', 'on', true);

  select username, xp, level
  into v_name, v_xp, v_old
  from public.profiles
  where id = p_user
  for update;

  if v_name is null then
    raise exception 'المستخدم مش موجود';
  end if;

  v_xp := greatest(0, v_xp + p_delta);
  v_progress := public.level_for_xp(v_xp);
  v_new := (v_progress->>'level')::integer;

  update public.profiles
  set
    xp = v_xp,
    level = v_new,
    total_xp_earned = total_xp_earned + case when p_delta > 0 then p_delta else 0 end
  where id = p_user;

  if v_new > v_old then
    insert into public.notifications (user_id, title, body, type)
    values (p_user, '🎉 LEVEL UP!', 'بقيت Level ' || v_new || ' 🔥', 'level_up');
  end if;

  insert into public.notifications (user_id, title, body, type)
  values (
    p_user,
    'تعديل XP',
    case when p_delta > 0 then 'الأدمن زودك ' || p_delta || ' XP' else 'الأدمن خصم منك ' || abs(p_delta) || ' XP' end,
    'admin_xp'
  );

  perform public.unlock_achievements(p_user);
  perform public.write_admin_log(
    'xp_changed',
    'user',
    p_user,
    'تعديل XP للاعب ' || v_name || ' بمقدار ' || p_delta,
    jsonb_build_object('delta', p_delta)
  );
end;
$$;

create or replace function public.admin_adjust_coins(p_user uuid, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_coins integer;
begin
  perform public.assert_admin();
  if p_delta = 0 or p_delta < -1000000 or p_delta > 1000000 then
    raise exception 'قيمة الكوينز مش مسموحة';
  end if;

  perform set_config('app.trusted_write', 'on', true);

  select username, coins into v_name, v_coins
  from public.profiles
  where id = p_user
  for update;

  if v_name is null then
    raise exception 'المستخدم مش موجود';
  end if;

  update public.profiles
  set
    coins = greatest(0, v_coins + p_delta),
    total_coins_earned = total_coins_earned + case when p_delta > 0 then p_delta else 0 end
  where id = p_user;

  insert into public.notifications (user_id, title, body, type)
  values (
    p_user,
    'تعديل الكوينز',
    case when p_delta > 0 then 'الأدمن زودك ' || p_delta || ' كوين' else 'الأدمن خصم منك ' || abs(p_delta) || ' كوين' end,
    'admin_coins'
  );

  perform public.unlock_achievements(p_user);
  perform public.write_admin_log(
    'coins_changed',
    'user',
    p_user,
    'تعديل الكوينز للاعب ' || v_name || ' بمقدار ' || p_delta,
    jsonb_build_object('delta', p_delta)
  );
end;
$$;

create or replace function public.admin_reset_streak(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  perform public.assert_admin();
  perform set_config('app.trusted_write', 'on', true);

  select username into v_name from public.profiles where id = p_user;
  if v_name is null then
    raise exception 'المستخدم مش موجود';
  end if;

  update public.profiles
  set current_streak = 0, last_streak_date = null
  where id = p_user;

  perform public.write_admin_log('streak_reset', 'user', p_user, 'تصفير ستريك اللاعب ' || v_name, '{}'::jsonb);
end;
$$;

create or replace function public.admin_set_username(p_user uuid, p_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_username, ''));
  v_old text;
begin
  perform public.assert_admin();
  if char_length(v_name) < 3 or char_length(v_name) > 24 or v_name ~ '[<>]' then
    raise exception 'اسم المستخدم لازم يكون من 3 لـ 24 حرف';
  end if;

  select username into v_old from public.profiles where id = p_user;
  if v_old is null then
    raise exception 'المستخدم مش موجود';
  end if;

  if exists (
    select 1 from public.profiles
    where lower(username) = lower(v_name) and id <> p_user
  ) then
    raise exception 'الاسم ده متاخد';
  end if;

  perform set_config('app.trusted_write', 'on', true);
  update public.profiles set username = v_name where id = p_user;

  perform public.write_admin_log(
    'username_changed',
    'user',
    p_user,
    'تغيير اسم ' || v_old || ' إلى ' || v_name,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  perform public.assert_admin();
  if p_user = auth.uid() then
    raise exception 'متقدرش تغيّر صلاحيتك بنفسك';
  end if;
  if p_role not in ('user', 'admin') then
    raise exception 'الصلاحية مش صحيحة';
  end if;

  select username into v_name from public.profiles where id = p_user;
  if v_name is null then
    raise exception 'المستخدم مش موجود';
  end if;

  perform set_config('app.trusted_write', 'on', true);
  update public.profiles set role = p_role where id = p_user;

  perform public.write_admin_log(
    'role_changed',
    'user',
    p_user,
    'تغيير صلاحية ' || v_name || ' إلى ' || p_role,
    jsonb_build_object('role', p_role)
  );
end;
$$;

create or replace function public.admin_ban_user(
  p_user uuid,
  p_reason text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_reason text := trim(coalesce(p_reason, ''));
begin
  perform public.assert_admin();
  if p_user = auth.uid() then
    raise exception 'متقدرش توقف حسابك';
  end if;
  if char_length(v_reason) < 2 or char_length(v_reason) > 400 then
    raise exception 'اكتب سبب الإيقاف';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'ميعاد انتهاء الإيقاف لازم يكون في المستقبل';
  end if;

  select username into v_name from public.profiles where id = p_user;
  if v_name is null then
    raise exception 'المستخدم مش موجود';
  end if;

  update public.bans set is_active = false where user_id = p_user and is_active;

  insert into public.bans (user_id, reason, banned_by, expires_at, is_active)
  values (p_user, v_reason, auth.uid(), p_expires_at, true);

  insert into public.notifications (user_id, title, body, type)
  values (p_user, '🚫 الحساب متوقف', v_reason, 'ban');

  perform public.write_admin_log(
    'user_banned',
    'user',
    p_user,
    'إيقاف اللاعب ' || v_name,
    jsonb_build_object('reason', v_reason, 'expires_at', p_expires_at)
  );
end;
$$;

create or replace function public.admin_unban_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  perform public.assert_admin();
  select username into v_name from public.profiles where id = p_user;
  if v_name is null then
    raise exception 'المستخدم مش موجود';
  end if;

  update public.bans set is_active = false where user_id = p_user and is_active;

  perform public.write_admin_log('user_unbanned', 'user', p_user, 'فك إيقاف اللاعب ' || v_name, '{}'::jsonb);
end;
$$;

create or replace function public.admin_send_notification(
  p_user uuid,
  p_title text,
  p_body text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text := trim(coalesce(p_title, ''));
  v_body text := trim(coalesce(p_body, ''));
  v_count integer := 0;
begin
  perform public.assert_admin();
  if char_length(v_title) < 1 or char_length(v_title) > 120 then
    raise exception 'عنوان الإشعار مش صحيح';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 500 then
    raise exception 'نص الإشعار مش صحيح';
  end if;

  if p_user is null then
    insert into public.notifications (user_id, title, body, type)
    select id, v_title, v_body, 'admin_message'
    from public.profiles;
    get diagnostics v_count = row_count;
    perform public.write_admin_log('notification_sent', 'broadcast', null, 'إشعار للكل: ' || v_title, jsonb_build_object('count', v_count));
  else
    if not exists (select 1 from public.profiles where id = p_user) then
      raise exception 'المستخدم مش موجود';
    end if;
    insert into public.notifications (user_id, title, body, type)
    values (p_user, v_title, v_body, 'admin_message');
    v_count := 1;
    perform public.write_admin_log('notification_sent', 'user', p_user, 'إشعار للاعب: ' || v_title, '{}'::jsonb);
  end if;

  return v_count;
end;
$$;

create or replace function public.admin_save_achievement(p_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_slug text := trim(coalesce(p_payload->>'slug', ''));
  v_title text := trim(coalesce(p_payload->>'title', ''));
  v_description text := trim(coalesce(p_payload->>'description', ''));
  v_icon text := trim(coalesce(p_payload->>'icon', '🏆'));
  v_type text := coalesce(p_payload->>'condition_type', '');
  v_value integer;
  v_active boolean := coalesce((p_payload->>'is_active')::boolean, true);
begin
  perform public.assert_admin();

  if v_slug !~ '^[a-z0-9_]{2,40}$' then
    raise exception 'الكود لازم يكون حروف إنجليزي صغيرة وأرقام';
  end if;
  if char_length(v_title) < 2 or char_length(v_description) < 2 then
    raise exception 'اكتب عنوان ووصف الإنجاز';
  end if;
  if char_length(v_icon) < 1 or char_length(v_icon) > 8 then
    raise exception 'الأيقونة مش صحيحة';
  end if;
  if v_type not in ('completed_tasks', 'streak', 'level', 'coins', 'xp') then
    raise exception 'شرط الإنجاز مش صحيح';
  end if;
  if coalesce(p_payload->>'condition_value', '') !~ '^[0-9]+$' then
    raise exception 'قيمة الشرط لازم تكون رقم';
  end if;
  v_value := (p_payload->>'condition_value')::integer;
  if v_value < 1 or v_value > 1000000 then
    raise exception 'قيمة الشرط مش مسموحة';
  end if;

  if p_id is null then
    insert into public.achievements (slug, title, description, icon, condition_type, condition_value, is_active)
    values (v_slug, v_title, v_description, v_icon, v_type, v_value, v_active)
    returning id into v_id;
    perform public.write_admin_log('achievement_created', 'achievement', v_id, 'إنشاء إنجاز: ' || v_title, p_payload);
  else
    update public.achievements
    set
      slug = v_slug,
      title = v_title,
      description = v_description,
      icon = v_icon,
      condition_type = v_type,
      condition_value = v_value,
      is_active = v_active
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'الإنجاز مش موجود';
    end if;
    perform public.write_admin_log('achievement_updated', 'achievement', v_id, 'تعديل إنجاز: ' || v_title, p_payload);
  end if;

  return v_id;
end;
$$;

create or replace function public.admin_delete_achievement(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  perform public.assert_admin();
  select title into v_title from public.achievements where id = p_id;
  if v_title is null then
    raise exception 'الإنجاز مش موجود';
  end if;
  perform public.write_admin_log('achievement_deleted', 'achievement', p_id, 'مسح إنجاز: ' || v_title, '{}'::jsonb);
  delete from public.achievements where id = p_id;
end;
$$;

create or replace function public.admin_save_settings(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tz text;
  v_levels jsonb;
  v_rewards jsonb;
  v_diff jsonb;
  v_prev integer;
  v_item jsonb;
  v_len integer;
  v_i integer;
  v_day integer;
  v_coins integer;
  v_user uuid;
begin
  perform public.assert_admin();

  v_tz := trim(coalesce(p_payload->>'timezone', 'Africa/Cairo'));
  begin
    perform now() at time zone v_tz;
  exception
    when others then
      raise exception 'المنطقة الزمنية مش صحيحة';
  end;

  v_levels := p_payload->'level_thresholds';
  if v_levels is null or jsonb_typeof(v_levels) <> 'array' then
    raise exception 'مستويات الـ XP مش صحيحة';
  end if;
  v_len := jsonb_array_length(v_levels);
  if v_len < 2 or v_len > 50 then
    raise exception 'حط من مستويين لـ 50 مستوى';
  end if;
  if coalesce(v_levels->>0, '') !~ '^[0-9]+$' or (v_levels->>0)::integer <> 0 then
    raise exception 'أول مستوى لازم يبدأ من 0 XP';
  end if;
  v_prev := -1;
  for v_i in 0..(v_len - 1) loop
    if coalesce(v_levels->>v_i, '') !~ '^[0-9]+$' then
      raise exception 'قيم الـ XP لازم تكون أرقام';
    end if;
    if (v_levels->>v_i)::integer <= v_prev then
      raise exception 'كل مستوى لازم يكون أعلى من اللي قبله';
    end if;
    v_prev := (v_levels->>v_i)::integer;
    if v_prev > 100000000 then
      raise exception 'قيمة الـ XP كبيرة أوي';
    end if;
  end loop;

  v_rewards := p_payload->'daily_rewards';
  if v_rewards is null or jsonb_typeof(v_rewards) <> 'array' or jsonb_array_length(v_rewards) <> 7 then
    raise exception 'لازم 7 مكافآت دخول يومية';
  end if;

  v_diff := p_payload->'difficulty_defaults';
  if v_diff is null or jsonb_typeof(v_diff) <> 'object' then
    raise exception 'مكافآت الصعوبة مش صحيحة';
  end if;

  insert into public.settings (key, value) values
    ('leaderboard_enabled', to_jsonb(coalesce((p_payload->>'leaderboard_enabled')::boolean, true))),
    ('streak_reset_on_miss', to_jsonb(coalesce((p_payload->>'streak_reset_on_miss')::boolean, true))),
    ('timezone', to_jsonb(v_tz)),
    ('level_thresholds', v_levels),
    ('difficulty_defaults', v_diff)
  on conflict (key) do update
  set value = excluded.value, updated_at = now();

  if (
    select count(distinct (reward.value->>'day')::integer)
    from jsonb_array_elements(v_rewards) as reward(value)
  ) <> 7 then
    raise exception 'أيام المكافآت لازم تكون من 1 لـ 7 من غير تكرار';
  end if;

  delete from public.daily_login_rewards where day_number between 1 and 7;
  for v_item in
    select reward.value
    from jsonb_array_elements(v_rewards) as reward(value)
  loop
    if coalesce(v_item->>'day', '') !~ '^[0-9]+$' or coalesce(v_item->>'coins', '') !~ '^[0-9]+$' then
      raise exception 'مكافأة يومية مش صحيحة';
    end if;
    v_day := (v_item->>'day')::integer;
    v_coins := (v_item->>'coins')::integer;
    if v_day < 1 or v_day > 7 or v_coins < 0 or v_coins > 1000000 then
      raise exception 'مكافأة يومية مش صحيحة';
    end if;
    insert into public.daily_login_rewards (day_number, coins) values (v_day, v_coins);
  end loop;

  perform set_config('app.trusted_write', 'on', true);
  for v_user in select id from public.profiles loop
    update public.profiles
    set level = (public.level_for_xp(xp)->>'level')::integer
    where id = v_user;
    perform public.unlock_achievements(v_user);
  end loop;

  perform public.write_admin_log('settings_updated', 'settings', null, 'تحديث إعدادات اللعبة', p_payload);
end;
$$;

create or replace function public.admin_log_password_reset(p_user uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  perform public.write_admin_log(
    'password_reset',
    'user',
    p_user,
    'إرسال رابط تغيير الباسورد',
    jsonb_build_object('email', p_email)
  );
end;
$$;

create or replace function public.admin_log_user_deleted(
  p_user uuid,
  p_username text,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  if p_user = auth.uid() then
    raise exception 'متقدرش تمسح حسابك';
  end if;
  perform public.write_admin_log(
    'user_deleted',
    'user',
    p_user,
    'مسح المستخدم ' || coalesce(p_username, ''),
    jsonb_build_object('email', p_email)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on
  public.profiles,
  public.tasks,
  public.task_assignments,
  public.task_submissions,
  public.notifications,
  public.achievements,
  public.user_achievements,
  public.bans,
  public.user_daily_logins,
  public.daily_login_rewards,
  public.admin_logs
to authenticated;

grant update (username, avatar_url) on public.profiles to authenticated;
grant update (is_read) on public.notifications to authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.current_ban() to authenticated;
grant execute on function public.touch_session() to authenticated;
grant execute on function public.claim_daily_reward() to authenticated;
grant execute on function public.submit_task(uuid, text, text) to authenticated;
grant execute on function public.level_for_xp(integer) to authenticated;
grant execute on function public.get_public_config() to authenticated;
grant execute on function public.get_leaderboard(text) to authenticated;

grant execute on function public.admin_dashboard() to authenticated;
grant execute on function public.admin_save_task(uuid, jsonb, uuid[]) to authenticated;
grant execute on function public.admin_delete_task(uuid) to authenticated;
grant execute on function public.admin_duplicate_task(uuid) to authenticated;
grant execute on function public.admin_review_submission(uuid, boolean, text) to authenticated;
grant execute on function public.admin_adjust_xp(uuid, integer) to authenticated;
grant execute on function public.admin_adjust_coins(uuid, integer) to authenticated;
grant execute on function public.admin_reset_streak(uuid) to authenticated;
grant execute on function public.admin_set_username(uuid, text) to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_ban_user(uuid, text, timestamptz) to authenticated;
grant execute on function public.admin_unban_user(uuid) to authenticated;
grant execute on function public.admin_send_notification(uuid, text, text) to authenticated;
grant execute on function public.admin_save_achievement(uuid, jsonb) to authenticated;
grant execute on function public.admin_delete_achievement(uuid) to authenticated;
grant execute on function public.admin_save_settings(jsonb) to authenticated;
grant execute on function public.admin_log_user_deleted(uuid, text, text) to authenticated;
grant execute on function public.admin_log_password_reset(uuid, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant execute on function public.handle_new_user() to supabase_auth_admin;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.bans enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.task_submissions enable row level security;
alter table public.daily_login_rewards enable row level security;
alter table public.user_daily_logins enable row level security;
alter table public.notifications enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.admin_logs enable row level security;
alter table public.settings enable row level security;

create policy profiles_select on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy profiles_update on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy bans_select on public.bans
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy tasks_select on public.tasks
for select to authenticated
using (
  public.is_admin()
  or (
    is_active
    and (
      assign_to = 'everyone'
      or exists (
        select 1 from public.task_assignments a
        where a.task_id = tasks.id and a.user_id = auth.uid()
      )
    )
  )
  or exists (
    select 1 from public.task_submissions s
    where s.task_id = tasks.id and s.user_id = auth.uid()
  )
);

create policy task_assignments_select on public.task_assignments
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy submissions_select on public.task_submissions
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy rewards_select on public.daily_login_rewards
for select to authenticated
using (true);

create policy logins_select on public.user_daily_logins
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy notifications_select on public.notifications
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy notifications_update on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy achievements_select on public.achievements
for select to authenticated
using (is_active or public.is_admin());

create policy user_achievements_select on public.user_achievements
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy admin_logs_select on public.admin_logs
for select to authenticated
using (public.is_admin());

-- Settings have no policies. Only security-definer functions can read them.

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('task-submissions', 'task-submissions', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('reward-images', 'reward-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy reward_images_public_read on storage.objects
for select to public
using (bucket_id = 'reward-images');

create policy avatars_public_read on storage.objects
for select to public
using (bucket_id = 'avatars');

create policy avatars_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy avatars_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy avatars_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy submissions_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'task-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy submissions_read_own_or_admin on storage.objects
for select to authenticated
using (
  bucket_id = 'task-submissions'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

-- Promote the first admin after you register. Run both lines together:
-- select set_config('app.trusted_write', 'on', true);
-- update public.profiles set role = 'admin' where email = 'you@example.com';
