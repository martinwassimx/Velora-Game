import Link from "next/link";
import { Alert, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/format";
import type { Profile, PublicConfig } from "@/lib/types";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const q = (params.q ?? "").replace(/[%_,.()]/g, "").trim();
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  if (q) query = query.or(`username.ilike.%${q}%,email.ilike.%${q}%`);
  if (params.role === "admin" || params.role === "user") query = query.eq("role", params.role);

  const [{ data: profiles }, { data: bans }, { data: config }] = await Promise.all([
    query,
    supabase.from("bans").select("user_id, reason, expires_at, is_active").eq("is_active", true),
    supabase.rpc("get_public_config"),
  ]);
  const timeZone = (config as PublicConfig | null)?.timezone ?? "Africa/Cairo";
  const activeBans = new Map(
    (bans ?? [])
      .filter((ban) => !ban.expires_at || new Date(ban.expires_at) > new Date())
      .map((ban) => [ban.user_id, ban]),
  );
  let rows = (profiles ?? []) as Profile[];
  if (params.status === "banned") rows = rows.filter((row) => activeBans.has(row.id));
  if (params.status === "active") rows = rows.filter((row) => !activeBans.has(row.id));

  return (
    <div>
      <PageHeader title="المستخدمين" subtitle="دوّر، فلتر، وافتح بروفايل أي لاعب." />
      {params.ok === "deleted" ? <Alert tone="ok">الحساب اتمسح.</Alert> : null}
      <form className="card mb-4 grid gap-3 p-4 md:grid-cols-4">
        <input className="field md:col-span-2" name="q" defaultValue={params.q ?? ""} placeholder="اسم أو إيميل" />
        <select className="field" name="role" defaultValue={params.role ?? ""}>
          <option value="">كل الصلاحيات</option>
          <option value="user">لاعب</option>
          <option value="admin">أدمن</option>
        </select>
        <select className="field" name="status" defaultValue={params.status ?? ""}>
          <option value="">الكل</option>
          <option value="active">شغال</option>
          <option value="banned">موقوف</option>
        </select>
        <button className="btn btn-primary md:col-span-4">بحث</button>
      </form>
      <div className="grid gap-2">
        {rows.map((row) => {
          const ban = activeBans.get(row.id);
          return (
            <Link key={row.id} href={`/admin/users/${row.id}`} className="card grid gap-2 p-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
              <div>
                <p className="font-extrabold">{row.username}</p>
                <p className="text-sm text-slate-300">{row.email}</p>
              </div>
              <p className="text-sm text-slate-300">
                مستوى {formatNumber(row.level)} · {formatNumber(row.xp)} XP · {formatNumber(row.coins)} كوين
              </p>
              <div className="text-sm">
                <span className="chip">{row.role === "admin" ? "أدمن" : "لاعب"}</span>
                {ban ? <span className="chip ms-2">موقوف</span> : null}
                <p className="mt-1 text-slate-400">{formatDate(row.created_at, timeZone)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
