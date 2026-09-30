import { createAdminClient } from "@/lib/supabase/admin";

const KEY = "first_submit_coin_bonus";

function asBonuses(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return new Map<string, number>();
  const bonuses = new Map<string, number>();
  for (const [id, amount] of Object.entries(value)) {
    if (typeof amount === "number" && Number.isInteger(amount) && amount >= 0 && amount <= 1000000) {
      bonuses.set(id, amount);
    }
  }
  return bonuses;
}

export async function getFirstSubmitBonuses() {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("settings").select("value").eq("key", KEY).maybeSingle();
    return asBonuses(data?.value);
  } catch {
    return new Map<string, number>();
  }
}

export function firstSubmitBonus(bonuses: Map<string, number>, taskId: string, coinReward: number) {
  return bonuses.has(taskId) ? bonuses.get(taskId)! : coinReward;
}

export async function setFirstSubmitBonus(taskId: string, bonus: number | null) {
  const bonuses = await getFirstSubmitBonuses();
  if (bonus === null) bonuses.delete(taskId);
  else bonuses.set(taskId, bonus);
  const admin = createAdminClient();
  await admin.from("settings").upsert(
    { key: KEY, value: Object.fromEntries(bonuses), updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
}
