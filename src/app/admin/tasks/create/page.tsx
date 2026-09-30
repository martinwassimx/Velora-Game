import Link from "next/link";
import { TaskForm } from "@/components/task-form";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { FALLBACK_REWARDS } from "@/lib/constants";
import type { PublicConfig } from "@/lib/types";

export default async function CreateTaskPage() {
  const { supabase } = await requireAdmin();
  const [{ data: users }, { data: config }] = await Promise.all([
    supabase.from("profiles").select("id, username").order("username").limit(500),
    supabase.rpc("get_public_config"),
  ]);
  const settings = config as PublicConfig | null;

  return (
    <div>
      <Link href="/admin/tasks" className="text-sm font-bold text-cyan-200">رجوع للمهام</Link>
      <PageHeader title="مهمة جديدة" subtitle="اكتب التفاصيل والمكافأة، وبعدين عيّنها." />
      <TaskForm
        users={users ?? []}
        assignedIds={[]}
        defaults={{ ...FALLBACK_REWARDS, ...(settings?.difficulty_defaults ?? {}) }}
        deadlineValue=""
      />
    </div>
  );
}
