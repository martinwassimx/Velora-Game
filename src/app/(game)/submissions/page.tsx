import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { PublicConfig } from "@/lib/types";

type Row = {
  id: string;
  status: string;
  note: string | null;
  rejection_reason: string | null;
  created_at: string;
  task_id: string;
  tasks: { title: string } | { title: string }[] | null;
};

function titleOf(tasks: Row["tasks"]) {
  if (!tasks) return "Mission";
  return Array.isArray(tasks) ? tasks[0]?.title ?? "Mission" : tasks.title;
}

export default async function SubmissionsPage() {
  const { supabase, profile } = await requireUser();
  const [{ data }, { data: config }] = await Promise.all([
    supabase
      .from("task_submissions")
      .select("id, status, note, rejection_reason, created_at, task_id, tasks(title)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase.rpc("get_public_config"),
  ]);
  const rows = (data ?? []) as Row[];
  const timeZone = (config as PublicConfig | null)?.timezone ?? "Africa/Cairo";

  return (
    <div>
      <PageHeader title="My submissions" subtitle={`You sent ${profile.total_submitted_tasks} submissions, and ${profile.total_completed_tasks} were approved.`} />
      {rows.length === 0 ? (
        <EmptyState title="No submissions yet" body="Finish a mission and it will show up here." />
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <Link key={row.id} href={`/tasks/${row.task_id}`} className="card block p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-extrabold">{titleOf(row.tasks)}</h2>
                <span className="chip">{STATUS_LABEL[row.status]}</span>
              </div>
              <p className="mt-2 text-sm text-[#a1a1aa]">{formatDate(row.created_at, timeZone)}</p>
              {row.rejection_reason ? <p className="mt-2 text-sm text-rose-200">Reason: {row.rejection_reason}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
