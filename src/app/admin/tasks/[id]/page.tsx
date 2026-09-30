import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { Alert, PageHeader } from "@/components/ui";
import { deleteTask, duplicateTask } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { FALLBACK_REWARDS } from "@/lib/constants";
import { toLocalInput } from "@/lib/format";
import type { PublicConfig, Task } from "@/lib/types";

export default async function EditTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: task }, { data: assignments }, { data: users }, { data: config }] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).maybeSingle(),
    supabase.from("task_assignments").select("user_id").eq("task_id", id),
    supabase.from("profiles").select("id, username").order("username").limit(500),
    supabase.rpc("get_public_config"),
  ]);
  if (!task) notFound();
  const current = task as Task;
  const settings = config as PublicConfig | null;
  const timeZone = settings?.timezone ?? "Africa/Cairo";

  return (
    <div className="space-y-4">
      <Link href="/admin/tasks" className="text-sm font-bold text-cyan-200">رجوع للمهام</Link>
      <PageHeader title="تعديل المهمة" subtitle={current.title} />
      {query.error ? <Alert tone="error">{query.error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <form action={duplicateTask}>
          <input type="hidden" name="id" value={current.id} />
          <button className="btn btn-ghost">نسخ المهمة</button>
        </form>
        <form action={deleteTask}>
          <input type="hidden" name="id" value={current.id} />
          <button className="btn btn-danger">مسح المهمة</button>
        </form>
      </div>
      <TaskForm
        task={current}
        users={users ?? []}
        assignedIds={(assignments ?? []).map((item) => item.user_id)}
        defaults={{ ...FALLBACK_REWARDS, ...(settings?.difficulty_defaults ?? {}) }}
        deadlineValue={toLocalInput(current.deadline, timeZone)}
      />
    </div>
  );
}
