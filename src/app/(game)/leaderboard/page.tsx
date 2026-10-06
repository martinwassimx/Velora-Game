import { Icon } from "@/components/icons";
import { Avatar, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import type { LeaderRow, PublicConfig } from "@/lib/types";

const sorts = [
  { id: "xp", label: "XP" },
  { id: "completed", label: "Missions" },
  { id: "coins", label: "Coins" },
  { id: "streak", label: "Streak" },
];

function Rank({ place }: { place: number }) {
  return (
    <span className="grid w-10 place-items-center text-sm font-semibold text-[#a1a1aa]">
      {place <= 3 ? <Icon name={place === 1 ? "crown" : "award"} className="mb-0.5 h-4 w-4" /> : null}
      {formatNumber(place)}
    </span>
  );
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
      <PageHeader title="Leaderboard" subtitle="Rankings, with no private details." />
      {!enabled && profile.role !== "admin" ? (
        <EmptyState title="The leaderboard is closed right now" body="An admin has turned the leaderboard off." />
      ) : (
        <>
          {!enabled ? <p className="mb-3 text-sm text-[#e4e4e7]">The leaderboard is hidden from players. You can see it because you're an admin.</p> : null}
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {sorts.map((item) => (
              <a key={item.id} href={`/leaderboard?sort=${item.id}`} className={`chip shrink-0 ${sort === item.id ? "bg-[#fafafa] text-[#09090b]" : ""}`}>
                {item.label}
              </a>
            ))}
          </div>
          {error ? <EmptyState title="We couldn't load the rankings" body="Try again in a moment." /> : null}
          <div className="grid gap-2">
            {rows.map((row) => (
              <article key={row.user_id} className={`card flex items-center gap-3 p-3 ${row.is_me ? "border-[#fafafa]" : ""}`}>
                <Rank place={Number(row.place)} />
                <Avatar name={row.username} path={row.avatar_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{row.username}{row.is_me ? " · You" : ""}</p>
                  <p className="text-sm text-[#a1a1aa]">Level {formatNumber(row.level)}</p>
                </div>
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {sort === "completed" ? (
                    formatNumber(row.total_completed_tasks)
                  ) : sort === "coins" ? (
                    <><Icon name="coin" /> {formatNumber(row.coins)}</>
                  ) : sort === "streak" ? (
                    <><Icon name="flame" /> {formatNumber(row.current_streak)}</>
                  ) : (
                    <><Icon name="zap" /> {formatNumber(row.xp)}</>
                  )}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
