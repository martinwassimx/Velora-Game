import Link from "next/link";
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
          <span className="text-[11px] text-cyan-100">{formatNumber(value(row))}</span>
          <div className="rounded-t-lg bg-gradient-to-t from-cyan-400 to-violet-300" style={{ height: `${Math.max(8, (value(row) / max) * 100)}%` }} />
          <span className="text-[10px] text-slate-400">{row.date.slice(5)}</span>
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
    return <PageHeader title="لوحة التحكم" subtitle="مقدرناش نحمّل الأرقام. اتأكد إن قاعدة البيانات متظبطة." />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="لوحة التحكم" subtitle="ملخص اللاعبين والمهام والمكافآت." action={<Link href="/admin/submissions" className="btn btn-primary">طلبات المراجعة</Link>} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="👥" label="كل المستخدمين" value={formatNumber(stats.total_users)} />
        <Stat icon="🟢" label="نشطين آخر 7 أيام" value={formatNumber(stats.active_users)} />
        <Stat icon="🚫" label="موقوفين" value={formatNumber(stats.banned_users)} />
        <Stat icon="🎯" label="مهام النهارده" value={formatNumber(stats.tasks_today)} />
        <Stat icon="⏳" label="طلبات مستنية" value={formatNumber(stats.pending_submissions)} />
        <Stat icon="✅" label="مهام مقبولة" value={formatNumber(stats.completed_tasks)} />
        <Stat icon="⚡" label="XP اتوزع" value={formatNumber(stats.total_xp)} />
        <Stat icon="🪙" label="كوينز اتوزعت" value={formatNumber(stats.total_coins)} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-4">
          <h2 className="mb-3 font-extrabold">حسابات جديدة</h2>
          <Bars rows={stats.signups ?? []} value={(row) => row.count} />
        </article>
        <article className="card p-4">
          <h2 className="mb-3 font-extrabold">طلبات آخر 7 أيام</h2>
          <Bars
            rows={(stats.submissions ?? []).map((row) => ({ date: row.date, count: row.pending + row.approved + row.rejected }))}
            value={(row) => row.count}
          />
        </article>
      </section>
    </div>
  );
}
