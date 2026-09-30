import { Avatar, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import type { LeaderRow, PublicConfig } from "@/lib/types";

const sorts = [
  { id: "xp", label: "الـ XP" },
  { id: "completed", label: "المهام" },
  { id: "coins", label: "الكوينز" },
  { id: "streak", label: "الستريك" },
];

function medal(place: number) {
  if (place === 1) return "🥇";
  if (place === 2) return "🥈";
  if (place === 3) return "🥉";
  return formatNumber(place);
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const sort = sorts.some((item) => item.id === params.sort) ? params.sort! : "xp";
  const { supabase, profile } = await requireUser();
  const [{ data: config }, { data, error }] = await Promise.all([
    supabase.rpc("get_public_config"),
    supabase.rpc("get_leaderboard", { p_sort: sort }),
  ]);
  const settings = config as PublicConfig | null;
  const enabled = settings?.leaderboard_enabled !== false;
  const rows = (data ?? []) as LeaderRow[];

  return (
    <div>
      <PageHeader title="المتصدرين 🏆" subtitle="الترتيب من غير أي بيانات خاصة." />
      {!enabled && profile.role !== "admin" ? (
        <EmptyState title="المتصدرين مقفولين دلوقتي" body="الأدمن قافل لوحة الترتيب." />
      ) : (
        <>
          {!enabled ? <p className="mb-3 text-sm text-amber-200">المتصدرين مقفولين على اللاعبين، وأنت شايفهم لأنك أدمن.</p> : null}
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {sorts.map((item) => (
              <a key={item.id} href={`/leaderboard?sort=${item.id}`} className={`chip shrink-0 ${sort === item.id ? "bg-cyan-300 text-slate-950" : ""}`}>
                {item.label}
              </a>
            ))}
          </div>
          {error ? <EmptyState title="مقدرناش نحمّل الترتيب" body="جرّب تاني بعد شوية." /> : null}
          <div className="grid gap-2">
            {rows.map((row) => (
              <article key={row.user_id} className={`card flex items-center gap-3 p-3 ${row.is_me ? "border-cyan-300/60" : ""}`}>
                <span className="w-10 text-center text-lg font-black">{medal(Number(row.place))}</span>
                <Avatar name={row.username} path={row.avatar_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{row.username}{row.is_me ? " · أنت" : ""}</p>
                  <p className="text-sm text-slate-300">المستوى {formatNumber(row.level)}</p>
                </div>
                <p className="text-sm font-extrabold">
                  {sort === "completed"
                    ? `${formatNumber(row.total_completed_tasks)} مهمة`
                    : sort === "coins"
                      ? `${formatNumber(row.coins)} 🪙`
                      : sort === "streak"
                        ? `${formatNumber(row.current_streak)} 🔥`
                        : `${formatNumber(row.xp)} XP`}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
