import { SettingsForm } from "@/components/admin-panels";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { FALLBACK_REWARDS } from "@/lib/constants";
import type { PublicConfig } from "@/lib/types";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("get_public_config");
  const config = (data as PublicConfig | null) ?? {
    leaderboard_enabled: true,
    streak_reset_on_miss: true,
    timezone: "Africa/Cairo",
    level_thresholds: [0, 100, 250, 500, 850],
    daily_rewards: [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, coins: 0 })),
    difficulty_defaults: FALLBACK_REWARDS,
  };

  return (
    <div>
      <PageHeader title="الإعدادات" subtitle="المستويات، مكافأة الدخول، والستريك. التغيير بيحصل على السيرفر." />
      <SettingsForm config={config} />
    </div>
  );
}
