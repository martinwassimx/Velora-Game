import Link from "next/link";
import { Icon } from "@/components/icons";
import { TaskList } from "@/components/task-list";
import { Stat, XpBar } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { publishDueMission } from "@/lib/daily-missions";
import { formatNumber } from "@/lib/format";
import { getFirstSubmitBonuses } from "@/lib/first-bonus";
import { getFirstOnlyTaskIds, takenFirstOnlyTaskIds } from "@/lib/first-only";
import { getRewardShop } from "@/lib/rewards";
import { describeTask } from "@/lib/tasks";
import type { LevelProgress, PublicConfig, Task } from "@/lib/types";

export default async function HomePage() {
  await publishDueMission();
  const { supabase, profile } = await requireUser();
  const [{ data: progress }, { data: config }, { data: tasks }, { data: submissions }] = await Promise.all([
    supabase.rpc("level_for_xp", { p_xp: profile.xp }),
    supabase.rpc("get_public_config"),
    supabase.from("tasks").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("task_submissions").select("task_id, status").eq("user_id", profile.id),
  ]);

  const level = (progress as LevelProgress | null) ?? {
    level: profile.level,
    floor_xp: 0,
    next_xp: Math.max(profile.xp + 100, 1),
    xp: profile.xp,
  };
  const settings = (config as PublicConfig | null) ?? {
    leaderboard_enabled: true,
    streak_reset_on_miss: true,
    timezone: "Africa/Cairo",
    level_thresholds: [],
    daily_rewards: [],
    difficulty_defaults: {},
  };
  const taskRows = (tasks ?? []) as Task[];
  const submissionRows = submissions ?? [];
  const [firstOnlyIds, firstBonuses] = await Promise.all([getFirstOnlyTaskIds(), getFirstSubmitBonuses()]);
  const takenIds = await takenFirstOnlyTaskIds(taskRows.map((task) => task.id).filter((id) => firstOnlyIds.has(id)));
  const available = taskRows.filter((task) => {
    const mineHolds = submissionRows.some((item) => item.task_id === task.id && (item.status === "pending" || item.status === "approved"));
    return describeTask(task, submissionRows, takenIds.has(task.id) && !mineHolds).canSubmit;
  });
  const shop = await getRewardShop();

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm text-[#a1a1aa]">{profile.username}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Today</h1>
        <div className="mt-4">
          <XpBar level={level.level} xp={level.xp} floorXp={level.floor_xp} nextXp={level.next_xp} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Icon name="star" />} label="Level" value={formatNumber(profile.level)} />
        <Stat icon={<Icon name="zap" />} label="XP" value={formatNumber(profile.xp)} />
        <Stat icon={<Icon name="coin" />} label="Coins" value={formatNumber(profile.coins)} />
        <Stat icon={<Icon name="flame" />} label="Streak" value={`${formatNumber(profile.current_streak)} ${profile.current_streak === 1 ? "day" : "days"}`} />
      </section>

      <Link href="/rewards" className="card block p-4">
        <h2 className="font-extrabold">Rewards</h2>
        <p className="mt-1 text-sm text-[#a1a1aa]">
          {shop.comingSoon ? "Coming soon. Redemption is still closed." : "See the rewards you can claim with your coins."}
        </p>
      </Link>

      {settings.daily_rewards.length > 0 ? (
        <section className="card p-4">
          <h2 className="mb-3 font-extrabold">Daily login</h2>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
            {settings.daily_rewards.map((reward) => (
              <div key={reward.day} className={`rounded-2xl border px-2 py-3 text-center ${reward.day === Math.min(profile.current_streak || 1, 7) ? "border-[#fafafa] bg-[#1c1c1f]" : "border-[#2a2a2e]"}`}>
                <p className="text-xs text-[#a1a1aa]">Day {reward.day}</p>
                <p className="font-extrabold">{formatNumber(reward.coins)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Today's mission</h2>
          <Link href="/tasks" className="text-sm font-bold text-[#e4e4e7]">
            All missions
          </Link>
        </div>
        <TaskList
          tasks={available}
          submissions={submissionRows}
          timeZone={settings.timezone}
          firstOnlyIds={firstOnlyIds}
          takenIds={takenIds}
          firstBonuses={firstBonuses}
          emptyTitle="No missions available right now"
          emptyBody="When an admin publishes a mission, it will show up here."
        />
      </section>
    </div>
  );
}
