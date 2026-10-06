import { EmptyState, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { PublicConfig } from "@/lib/types";

type LogRow = {
  id: string;
  action: string;
  description: string;
  created_at: string;
  admin: { username: string } | { username: string }[] | null;
};

export default async function LogsPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: config }] = await Promise.all([
    supabase
      .from("admin_logs")
      .select("id, action, description, created_at, admin:profiles!admin_logs_admin_id_fkey(username)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.rpc("get_public_config"),
  ]);
  const rows = (data ?? []) as LogRow[];
  const timeZone = (config as PublicConfig | null)?.timezone ?? "Africa/Cairo";

  return (
    <div>
      <PageHeader title="Activity log" subtitle="Every important admin action is recorded here." />
      {rows.length === 0 ? <EmptyState title="The log is empty" body="The first action will be recorded here." /> : null}
      <div className="grid gap-2">
        {rows.map((row) => {
          const admin = Array.isArray(row.admin) ? row.admin[0] : row.admin;
          return (
            <article key={row.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-extrabold">{row.description}</h2>
                <span className="chip">{row.action}</span>
              </div>
              <p className="mt-1 text-sm text-[#a1a1aa]">
                {admin?.username ?? "Admin"} · {formatDate(row.created_at, timeZone)}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
