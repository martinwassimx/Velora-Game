import { TaskList } from "@/components/task-list";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { describeTask } from "@/lib/tasks";
import type { PublicConfig, Task } from "@/lib/types";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
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
  const visible = taskRows.filter((task) => {
    const info = describeTask(task, submissionRows);
    if (filter === "done") return info.state === "approved";
    if (filter === "waiting") return info.state === "pending";
    if (filter === "all") return true;
    return info.canSubmit;
  });

  const filters = [
    { id: "available", label: "المتاحة" },
    { id: "waiting", label: "مستنية المراجعة" },
    { id: "done", label: "المخلّصة" },
    { id: "all", label: "الكل" },
  ];

  return (
    <div>
      <PageHeader title="المهام" subtitle="اختار مهمة وخلّصها عشان تاخد المكافأة بعد الموافقة." />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {filters.map((item) => (
          <a key={item.id} href={`/tasks?filter=${item.id}`} className={`chip shrink-0 ${filter === item.id ? "bg-cyan-300 text-slate-950" : ""}`}>
            {item.label}
          </a>
        ))}
      </div>
      <TaskList tasks={visible} submissions={submissionRows} timeZone={settings?.timezone ?? "Africa/Cairo"} />
    </div>
  );
}
