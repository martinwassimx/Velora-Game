import Link from "next/link";
import { DIFFICULTY_LABEL, STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import { describeTask, firstSubmitterCoins } from "@/lib/tasks";
import type { Task } from "@/lib/types";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/ui";

const stateLabel: Record<string, string> = {
  ...STATUS_LABEL,
  inactive: "Paused",
};

export function TaskList({
  tasks,
  submissions,
  timeZone,
  firstOnlyIds,
  takenIds,
  firstBonuses,
  emptyTitle = "No missions right now",
  emptyBody = "A new one arrives every 24 hours.",
}: {
  tasks: Task[];
  submissions: { task_id: string; status: string }[];
  timeZone: string;
  firstOnlyIds?: Set<string>;
  takenIds?: Set<string>;
  firstBonuses?: Map<string, number>;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (tasks.length === 0) return <EmptyState title={emptyTitle} body={emptyBody} />;

  return (
    <div className="grid gap-3">
      {tasks.map((task) => {
        const mineHolds = submissions.some((item) => item.task_id === task.id && (item.status === "pending" || item.status === "approved"));
        const firstExtra = firstBonuses?.has(task.id) ? firstBonuses.get(task.id)! : task.coin_reward;
        const info = describeTask(task, submissions, Boolean(takenIds?.has(task.id) && !mineHolds));
        return (
          <Link key={task.id} href={`/tasks/${task.id}`} className="card block p-4 transition ">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-extrabold">{task.title}</h2>
              <span className="chip">{stateLabel[info.state]}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-7 text-[#a1a1aa]">{task.description || "No description"}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="chip">{DIFFICULTY_LABEL[task.difficulty]}</span>
              <span className="chip"><Icon name="zap" className="h-3.5 w-3.5" /> {formatNumber(task.xp_reward)} XP</span>
              <span className="chip">
                <Icon name="coin" className="h-3.5 w-3.5" /> {formatNumber(task.coin_reward)}
                {firstExtra > 0 ? ` · First ${formatNumber(firstSubmitterCoins(task.coin_reward, firstExtra))}` : ""}
              </span>
              {firstOnlyIds?.has(task.id) ? <span className="chip"><Icon name="flag" className="h-3.5 w-3.5" /> First player only</span> : null}
              {task.requires_photo ? <span className="chip"><Icon name="camera" className="h-3.5 w-3.5" /> Photo</span> : null}
              <span className="chip">{task.deadline ? formatDate(task.deadline, timeZone) : "No deadline"}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
