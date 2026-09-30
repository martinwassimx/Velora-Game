import { GameEffects } from "@/components/effects";
import { GameShell } from "@/components/game-shell";
import { requireUser } from "@/lib/auth";
import type { LevelProgress } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile, unread } = await requireUser();
  const [{ data: progress }, { data: rewardNote }, { data: levelNote }] = await Promise.all([
    supabase.rpc("level_for_xp", { p_xp: profile.xp }),
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

  const level = (progress as LevelProgress | null) ?? {
    level: profile.level,
    floor_xp: 0,
    next_xp: Math.max(profile.xp + 100, 1),
    xp: profile.xp,
  };

  return (
    <GameShell profile={profile} unread={unread} progress={level}>
      <GameEffects reward={rewardNote} levelUp={levelNote} />
      {children}
    </GameShell>
  );
}
