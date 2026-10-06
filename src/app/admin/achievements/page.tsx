import { AchievementForm } from "@/components/admin-panels";
import { Mark } from "@/components/icons";
import { Alert, PageHeader } from "@/components/ui";
import { deleteAchievement } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { CONDITION_LABEL } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { Achievement } from "@/lib/types";

export default async function AdminAchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("achievements").select("*").order("created_at");
  const items = (data ?? []) as Achievement[];
  const editing = items.find((item) => item.id === params.edit) ?? null;

  return (
    <div className="space-y-4">
      <PageHeader title="Achievements" subtitle="Players unlock them on their own when they meet the requirement." />
      {params.ok ? <Alert tone="ok">{params.ok === "deleted" ? "The achievement was deleted." : "The achievement was saved."}</Alert> : null}
      {params.error ? <Alert tone="error">{params.error}</Alert> : null}
      <AchievementForm achievement={editing} />
      <div className="grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <h2 className="flex items-center gap-2 font-extrabold"><Mark value={item.icon} /> {item.title}</h2>
              <p className="text-sm text-[#a1a1aa]">{item.description}</p>
              <p className="text-xs text-[#a1a1aa]">{CONDITION_LABEL[item.condition_type]} · {formatNumber(item.condition_value)} · {item.is_active ? "Visible" : "Hidden"}</p>
            </div>
            <div className="flex gap-2">
              <a className="btn btn-ghost" href={`/admin/achievements?edit=${item.id}`}>Edit</a>
              <form action={deleteAchievement}>
                <input type="hidden" name="id" value={item.id} />
                <button className="btn btn-danger">Delete</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
