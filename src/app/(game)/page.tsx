import Link from "next/link";
import { TaskList } from "@/components/task-list";
import { Stat, XpBar } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { getRewardShop } from "@/lib/rewards";
import { describeTask } from "@/lib/tasks";
import type { LevelProgress, PublicConfig, Task } from "@/lib/types";

export default async function HomePage() {
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
  const available = taskRows.filter((task) => describeTask(task, submissionRows).canSubmit);
  const shop = await getRewardShop();

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <p className="text-sm font-bold text-cyan-200">أهلاً يا {profile.username} 👋</p>
        <h1 className="mt-1 text-3xl font-black">جاهز لمهمة النهارده؟ 🎮</h1>
        <div className="mt-5">
          <XpBar level={level.level} xp={level.xp} floorXp={level.floor_xp} nextXp={level.next_xp} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon="⭐" label="المستوى" value={formatNumber(profile.level)} />
        <Stat icon="⚡" label="الـ XP" value={formatNumber(profile.xp)} />
        <Stat icon="🪙" label="الكوينز" value={formatNumber(profile.coins)} />
        <Stat icon="🔥" label="الستريك" value={`${formatNumber(profile.current_streak)} أيام`} />
        <Stat icon="✅" label="مهام مكتملة" value={formatNumber(profile.total_completed_tasks)} />
      </section>

      <Link href="/rewards" className="card block p-4">
        <h2 className="font-extrabold">استبدال الكوينز 🎁</h2>
        <p className="mt-1 text-sm text-slate-300">
          {shop.comingSoon ? "قريبًا. الزرار لسه مقفول." : "شوف المكافآت اللي تقدر تاخدها بالكوينز."}
        </p>
      </Link>

      {settings.daily_rewards.length > 0 ? (
        <section className="card p-4">
          <h2 className="mb-3 font-extrabold">مكافأة الدخول اليومية 🎁</h2>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
            {settings.daily_rewards.map((reward) => (
              <div key={reward.day} className={`rounded-2xl border px-2 py-3 text-center ${reward.day === Math.min(profile.current_streak || 1, 7) ? "border-amber-300 bg-amber-300/10" : "border-white/10"}`}>
                <p className="text-xs text-slate-300">يوم {reward.day}</p>
                <p className="font-extrabold">{formatNumber(reward.coins)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">مهمة النهارده</h2>
          <Link href="/tasks" className="text-sm font-bold text-cyan-200">
            كل المهام
          </Link>
        </div>
        <TaskList
          tasks={available}
          submissions={submissionRows}
          timeZone={settings.timezone}
          emptyTitle="مفيش مهام متاحة دلوقتي"
          emptyBody="لما الأدمن ينزل مهمة، هتظهر هنا."
        />
      </section>
    </div>
  );
}
