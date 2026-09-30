import Link from "next/link";
import { notFound } from "next/navigation";
import { UserEditor } from "@/components/admin-panels";
import { Alert, PageHeader, Stat } from "@/components/ui";
import { removeUser, resetStreak, sendPasswordReset, setRole, unbanUser } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/format";
import type { Ban, Profile, PublicConfig } from "@/lib/types";

const messages: Record<string, string> = {
  streak: "الستريك الحالي اتصفر.",
  role: "الصلاحية اتغيرت.",
  unban: "الإيقاف اتفك.",
  reset: "بعتنا رابط تغيير الباسورد.",
};

export default async function AdminUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireAdmin();
  const [{ data: profile }, { data: bans }, { data: config }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("bans").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.rpc("get_public_config"),
  ]);
  if (!profile) notFound();
  const person = profile as Profile;
  const timeZone = (config as PublicConfig | null)?.timezone ?? "Africa/Cairo";
  const banRows = (bans ?? []) as Ban[];
  const active = banRows.find((ban) => ban.is_active && (!ban.expires_at || new Date(ban.expires_at) > new Date()));

  return (
    <div className="space-y-4">
      <Link href="/admin/users" className="text-sm font-bold text-cyan-200">رجوع للمستخدمين</Link>
      <PageHeader title={person.username} subtitle={person.email} />
      {query.ok && messages[query.ok] ? <Alert tone="ok">{messages[query.ok]}</Alert> : null}
      {query.error ? <Alert tone="error">{query.error}</Alert> : null}
      {active ? <Alert tone="error">موقوف: {active.reason}{active.expires_at ? ` حتى ${formatDate(active.expires_at, timeZone)}` : " بشكل دائم"}</Alert> : null}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon="⭐" label="المستوى" value={formatNumber(person.level)} />
        <Stat icon="⚡" label="XP" value={formatNumber(person.xp)} />
        <Stat icon="🪙" label="كوينز" value={formatNumber(person.coins)} />
        <Stat icon="🔥" label="ستريك" value={formatNumber(person.current_streak)} />
        <Stat icon="✅" label="مهام" value={formatNumber(person.total_completed_tasks)} />
        <Stat icon="📤" label="طلبات" value={formatNumber(person.total_submitted_tasks)} />
      </section>
      <p className="text-sm text-slate-300">انضم {formatDate(person.created_at, timeZone)} · آخر دخول {formatDate(person.last_login, timeZone)}</p>
      <UserEditor userId={person.id} username={person.username} />
      <section className="card space-y-3 p-4">
        <h2 className="font-extrabold">إجراءات</h2>
        <div className="flex flex-wrap gap-2">
          <form action={setRole}>
            <input type="hidden" name="user_id" value={person.id} />
            <input type="hidden" name="role" value={person.role === "admin" ? "user" : "admin"} />
            <button className="btn btn-ghost">{person.role === "admin" ? "خلّيه لاعب" : "خلّيه أدمن"}</button>
          </form>
          <form action={resetStreak}>
            <input type="hidden" name="user_id" value={person.id} />
            <button className="btn btn-ghost">تصفير الستريك</button>
          </form>
          <form action={sendPasswordReset}>
            <input type="hidden" name="user_id" value={person.id} />
            <input type="hidden" name="email" value={person.email} />
            <button className="btn btn-ghost">إرسال تغيير الباسورد</button>
          </form>
          {active ? (
            <form action={unbanUser}>
              <input type="hidden" name="user_id" value={person.id} />
              <button className="btn btn-ok">فك الإيقاف</button>
            </form>
          ) : null}
          {user.id !== person.id ? (
            <form action={removeUser}>
              <input type="hidden" name="user_id" value={person.id} />
              <input type="hidden" name="username" value={person.username} />
              <input type="hidden" name="email" value={person.email} />
              <button className="btn btn-danger">مسح الحساب</button>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  );
}
