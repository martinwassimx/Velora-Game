import { Mark } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { englishCopy } from "@/lib/copy";
import { CONDITION_LABEL } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { Achievement } from "@/lib/types";

export default async function AchievementsPage() {
  const { supabase, profile } = await requireUser();
  const [{ data: catalog }, { data: mine }] = await Promise.all([
    supabase.from("achievements").select("*").eq("is_active", true).order("condition_value"),
    supabase.from("user_achievements").select("achievement_id, unlocked_at").eq("user_id", profile.id),
  ]);
  const unlocked = new Map((mine ?? []).map((item) => [item.achievement_id, item.unlocked_at]));
  const items = (catalog ?? []) as Achievement[];

  return (
    <div>
      <PageHeader title="Achievements" subtitle="They unlock on their own when you meet the requirement." />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const open = unlocked.has(item.id);
          return (
            <article key={item.id} className={`card p-4 ${open ? "" : "opacity-60"}`}>
              <Mark value={item.icon} className="h-7 w-7" />
              <h2 className="mt-2 text-lg font-extrabold">{englishCopy(item.title)}</h2>
              <p className="text-sm leading-7 text-[#a1a1aa]">{englishCopy(item.description)}</p>
              <p className="mt-2 text-xs text-[#a1a1aa]">
                {CONDITION_LABEL[item.condition_type]}: {formatNumber(item.condition_value)}
                {open ? " · Unlocked" : " · Locked"}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
