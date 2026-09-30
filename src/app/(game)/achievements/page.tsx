import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
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
      <PageHeader title="الإنجازات" subtitle="بتتفتح لوحدها لما توصل للشرط." />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const open = unlocked.has(item.id);
          return (
            <article key={item.id} className={`card p-4 ${open ? "" : "opacity-60"}`}>
              <p className="text-3xl">{item.icon}</p>
              <h2 className="mt-2 text-lg font-extrabold">{item.title}</h2>
              <p className="text-sm leading-7 text-slate-300">{item.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                {CONDITION_LABEL[item.condition_type]}: {formatNumber(item.condition_value)}
                {open ? " · مفتوحة" : " · لسه"}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
