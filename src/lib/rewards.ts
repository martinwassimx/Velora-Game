import { createAdminClient } from "@/lib/supabase/admin";

export type RedeemReward = {
  id: string;
  title: string;
  description: string;
  coins: number;
  image_path: string | null;
};

export type RewardShop = {
  comingSoon: boolean;
  rewards: RedeemReward[];
};

function asRewards(value: unknown): RedeemReward[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const title = typeof row.title === "string" ? row.title.trim() : "";
    const coins = Number(row.coins);
    if (!id || !title || !Number.isInteger(coins) || coins < 1) return [];
    return [
      {
        id,
        title,
        description: typeof row.description === "string" ? row.description.trim() : "",
        coins,
        image_path: typeof row.image_path === "string" && row.image_path.trim() ? row.image_path.trim() : null,
      },
    ];
  });
}

export async function getRewardShop(): Promise<RewardShop> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("settings").select("key, value").in("key", ["rewards_coming_soon", "redeem_rewards"]);
    if (error || !data) return { comingSoon: true, rewards: [] };
    const soon = data.find((row) => row.key === "rewards_coming_soon");
    const rewards = data.find((row) => row.key === "redeem_rewards");
    return {
      comingSoon: soon ? soon.value !== false : true,
      rewards: asRewards(rewards?.value),
    };
  } catch {
    return { comingSoon: true, rewards: [] };
  }
}

export async function saveRewardSetting(key: "rewards_coming_soon" | "redeem_rewards", value: boolean | RedeemReward[]) {
  const admin = createAdminClient();
  const { error } = await admin.from("settings").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  return error?.message ?? null;
}
