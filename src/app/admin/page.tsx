import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader, Stat } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

function Bars({ rows, value }: { rows: { date: string; count: number }[]; value: (row: { date: string; count: number }) => number }) {
  const max = Math.max(1, ...rows.map(value));
  return (
    <div className="flex h-40 items-end gap-2">
      {rows.map((row) => (
        <div key={row.date} className="flex h-full flex-1 flex-col justify-end gap-1 text-center">
          <span className="text-[11px] text-[#d4d4d8]">{formatNumber(value(row))}</span>
          <div className="rounded-t-lg bg-gradient-to-t from-[#fafafa] to-[#71717a]" style={{ height: `${Math.max(8, (value(row) / max) * 100)}%` }} />
          <span className="text-[10px] text-[#a1a1aa]">{row.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminHomePage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("admin_dashboard");
  const stats = data as DashboardStats | null;

  if (error || !stats) {
    return <PageHeader title="Dashboard" subtitle="We couldn't load the numbers. Make sure the database is set up." />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" subtitle="A summary of players, missions, and rewards." action={<Link href="/admin/submissions" className="btn btn-primary">Review queue</Link>} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Icon name="users" />} label="All users" value={formatNumber(stats.total_users)} />
        <Stat icon={<Icon name="activity" />} label="Active in the last 7 days" value={formatNumber(stats.active_users)} />
        <Stat icon={<Icon name="ban" />} label="Suspended" value={formatNumber(stats.banned_users)} />
        <Stat icon={<Icon name="target" />} label="Missions today" value={formatNumber(stats.tasks_today)} />
        <Stat icon={<Icon name="flag" />} label="Waiting for review" value={formatNumber(stats.pending_submissions)} />
        <Stat icon={<Icon name="check" />} label="Approved missions" value={formatNumber(stats.completed_tasks)} />
        <Stat icon={<Icon name="zap" />} label="XP awarded" value={formatNumber(stats.total_xp)} />
        <Stat icon={<Icon name="coin" />} label="Coins awarded" value={formatNumber(stats.total_coins)} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-4">
          <h2 className="mb-3 font-extrabold">New accounts</h2>
          <Bars rows={stats.signups ?? []} value={(row) => row.count} />
        </article>
        <article className="card p-4">
          <h2 className="mb-3 font-extrabold">Submissions in the last 7 days</h2>
          <Bars
            rows={(stats.submissions ?? []).map((row) => ({ date: row.date, count: row.pending + row.approved + row.rejected }))}
            value={(row) => row.count}
          />
        </article>
      </section>
    </div>
  );
}
