import { TaskList } from "@/components/task-list";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { publishDueMission } from "@/lib/daily-missions";
import { getFirstSubmitBonuses } from "@/lib/first-bonus";
import { getFirstOnlyTaskIds, takenFirstOnlyTaskIds } from "@/lib/first-only";
import { describeTask } from "@/lib/tasks";
import type { PublicConfig, Task } from "@/lib/types";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await publishDueMission();
  const params = await searchParams;
  const filter = params.filter ?? "available";
  const { supabase, profile } = await requireUser();
  const [{ data: config }, { data: tasks }, { data: submissions }] = await Promise.all([
    supabase.rpc("get_public_config"),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("task_submissions").select("task_id, status").eq("user_id", profile.id),
  ]);
  const settings = config as PublicConfig | null;
  const taskRows = (tasks ?? []) as Task[];
  const submissionRows = submissions ?? [];
  const [firstOnlyIds, firstBonuses] = await Promise.all([getFirstOnlyTaskIds(), getFirstSubmitBonuses()]);
  const takenIds = await takenFirstOnlyTaskIds(taskRows.map((task) => task.id).filter((id) => firstOnlyIds.has(id)));
  const visible = taskRows.filter((task) => {
    const mineHolds = submissionRows.some((item) => item.task_id === task.id && (item.status === "pending" || item.status === "approved"));
    const info = describeTask(task, submissionRows, takenIds.has(task.id) && !mineHolds);
    if (filter === "done") return info.state === "approved";
    if (filter === "waiting") return info.state === "pending";
    if (filter === "all") return true;
    return info.canSubmit;
  });

  const filters = [
    { id: "available", label: "Available" },
    { id: "waiting", label: "In review" },
    { id: "done", label: "Completed" },
    { id: "all", label: "All" },
  ];

  return (
    <div>
      <PageHeader title="Missions" subtitle="Pick a mission and finish it. The reward is added after approval." />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {filters.map((item) => (
          <a key={item.id} href={`/tasks?filter=${item.id}`} className={`chip shrink-0 ${filter === item.id ? "bg-[#fafafa] text-[#09090b]" : ""}`}>
            {item.label}
          </a>
        ))}
      </div>
      <TaskList tasks={visible} submissions={submissionRows} timeZone={settings?.timezone ?? "Africa/Cairo"} firstOnlyIds={firstOnlyIds} takenIds={takenIds} firstBonuses={firstBonuses} />
    </div>
  );
}
