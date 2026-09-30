import Link from "next/link";
import { DIFFICULTY_LABEL, STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import { describeTask, firstSubmitterCoins } from "@/lib/tasks";
import type { Task } from "@/lib/types";
import { EmptyState } from "@/components/ui";

const stateLabel: Record<string, string> = {
  ...STATUS_LABEL,
  inactive: "المهمة متوقفة",
};

export function TaskList({
  tasks,
  submissions,
  timeZone,
  firstOnlyIds,
  takenIds,
  emptyTitle = "مفيش مهام دلوقتي",
  emptyBody = "استنى الأدمن ينزل مهمة جديدة.",
}: {
  tasks: Task[];
  submissions: { task_id: string; status: string }[];
  timeZone: string;
  firstOnlyIds?: Set<string>;
  takenIds?: Set<string>;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (tasks.length === 0) return <EmptyState title={emptyTitle} body={emptyBody} />;

  return (
    <div className="grid gap-3">
      {tasks.map((task) => {
        const mineHolds = submissions.some((item) => item.task_id === task.id && (item.status === "pending" || item.status === "approved"));
        const info = describeTask(task, submissions, Boolean(takenIds?.has(task.id) && !mineHolds));
        return (
          <Link key={task.id} href={`/tasks/${task.id}`} className="card block p-4 transition hover:-translate-y-0.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-extrabold">{task.title}</h2>
              <span className="chip">{stateLabel[info.state]}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-300">{task.description || "من غير وصف"}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="chip">{DIFFICULTY_LABEL[task.difficulty]}</span>
              <span className="chip">⚡ {formatNumber(task.xp_reward)} XP</span>
              <span className="chip">🪙 {formatNumber(task.coin_reward)} · أول واحد {formatNumber(firstSubmitterCoins(task.coin_reward))}</span>
              {firstOnlyIds?.has(task.id) ? <span className="chip">🏁 لأول واحد بس</span> : null}
              {task.requires_photo ? <span className="chip">📷 صورة</span> : null}
              <span className="chip">⏰ {task.deadline ? formatDate(task.deadline, timeZone) : "من غير ميعاد"}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
