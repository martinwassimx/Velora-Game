import Link from "next/link";
import { Alert, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { firstSubmitBonus, getFirstSubmitBonuses } from "@/lib/first-bonus";
import { getFirstOnlyTaskIds } from "@/lib/first-only";
import { DIFFICULTY_LABEL } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import type { PublicConfig, Task } from "@/lib/types";

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data }, { data: config }] = await Promise.all([
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    supabase.rpc("get_public_config"),
  ]);
  const tasks = (data ?? []) as Task[];
  const [firstOnlyIds, firstBonuses] = await Promise.all([getFirstOnlyTaskIds(), getFirstSubmitBonuses()]);
  const timeZone = (config as PublicConfig | null)?.timezone ?? "Africa/Cairo";

  return (
    <div>
      <PageHeader title="المهام" subtitle="اعمل مهمة ووزّعها على الكل أو على لاعبين محددين." action={<Link href="/admin/tasks/create" className="btn btn-primary">مهمة جديدة</Link>} />
      {params.ok === "deleted" ? <div className="mb-3"><Alert tone="ok">المهمة اتمسحت.</Alert></div> : null}
      <div className="grid gap-3">
        {tasks.map((task) => {
          const firstExtra = firstSubmitBonus(firstBonuses, task.id, task.coin_reward);
          return (
          <Link key={task.id} href={`/admin/tasks/${task.id}`} className="card block p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold">{task.title}</h2>
              <span className="chip">{task.is_active ? "شغالة" : "موقوفة"}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <span className="chip">{DIFFICULTY_LABEL[task.difficulty]}</span>
              <span className="chip">{formatNumber(task.xp_reward)} XP</span>
              <span className="chip">{formatNumber(task.coin_reward)} كوين</span>
              {firstExtra > 0 ? <span className="chip">أول واحد +{formatNumber(firstExtra)}</span> : null}
              <span className="chip">{task.assign_to === "everyone" ? "لكل اللاعبين" : "لاعبين محددين"}</span>
              {firstOnlyIds.has(task.id) ? <span className="chip">🏁 لأول واحد بس</span> : null}
              <span className="chip">{formatDate(task.created_at, timeZone)}</span>
            </div>
          </Link>
          );
        })}
        {tasks.length === 0 ? <p className="text-slate-300">لسه مفيش مهام.</p> : null}
      </div>
    </div>
  );
}
