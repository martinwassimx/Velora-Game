import { AdminShell } from "@/components/admin-shell";
import { GameEffects } from "@/components/effects";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAdmin();
  const [{ data: rewardNote }, { data: levelNote }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, body")
      .eq("user_id", user.id)
      .eq("type", "daily_reward")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("notifications")
      .select("id, body")
      .eq("user_id", user.id)
      .eq("type", "level_up")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <AdminShell>
      <GameEffects reward={rewardNote} levelUp={levelNote} />
      {children}
    </AdminShell>
  );
}
