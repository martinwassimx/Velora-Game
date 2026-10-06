"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { arabicError } from "@/lib/errors";
import { getRewardShop, saveRewardSetting } from "@/lib/rewards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/types";

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function rewardStorage() {
  const admin = createAdminClient();
  const existing = await admin.storage.getBucket("reward-images");
  if (!existing.data) {
    const created = await admin.storage.createBucket("reward-images", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (created.error && !/already exists/i.test(created.error.message)) return { admin, error: created.error.message };
  }
  return { admin, error: null as string | null };
}

function refreshShop() {
  revalidatePath("/rewards");
  revalidatePath("/admin/rewards");
  revalidatePath("/");
}

async function logRewardChange(adminId: string, description: string) {
  const admin = createAdminClient();
  await admin.from("admin_logs").insert({
    admin_id: adminId,
    action: "rewards_updated",
    target_type: "settings",
    description,
  });
}

export async function saveRewardVisibility(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const comingSoon = formData.get("rewards_coming_soon") === "on";
  const error = await saveRewardSetting("rewards_coming_soon", comingSoon);
  if (error) return { error: arabicError(error) };
  await logRewardChange(user.id, comingSoon ? "Rewards are marked as coming soon" : "Rewards are now visible to players");
  refreshShop();
  return { ok: comingSoon ? "Players will see Coming soon." : "Rewards are now visible to players." };
}

export async function addRedeemReward(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const coins = Number(formData.get("coins"));
  if (title.length < 2 || title.length > 80) return { error: "The reward name must be 2 to 80 characters" };
  if (description.length > 300) return { error: "That description is too long" };
  if (!Number.isInteger(coins) || coins < 1 || coins > 1000000) return { error: "The coin amount must be a whole number" };

  const shop = await getRewardShop();
  if (shop.rewards.length >= 50) return { error: "You've reached the limit. Delete a reward first" };

  const file = formData.get("photo");
  const id = crypto.randomUUID();
  let imagePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { error: "The image must be under 5 MB" };
    const ext = PHOTO_TYPES[file.type];
    if (!ext) return { error: "The image must be JPG, PNG, or WEBP" };
    const storage = await rewardStorage();
    if (storage.error) return { error: "We couldn't prepare image storage. Try again" };
    imagePath = `${id}.${ext}`;
    const uploaded = await storage.admin.storage.from("reward-images").upload(imagePath, new Uint8Array(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });
    if (uploaded.error) return { error: "We couldn't upload the image. Try again" };
  }

  const error = await saveRewardSetting("redeem_rewards", [
    ...shop.rewards,
    { id, title, description, coins, image_path: imagePath },
  ]);
  if (error) {
    if (imagePath) {
      const admin = createAdminClient();
      await admin.storage.from("reward-images").remove([imagePath]);
    }
    return { error: arabicError(error) };
  }
  await logRewardChange(user.id, `Added reward: ${title}`);
  refreshShop();
  return { ok: "The reward was added." };
}

export async function deleteRedeemReward(formData: FormData) {
  const { user } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const shop = await getRewardShop();
  const removed = shop.rewards.find((item) => item.id === id);
  const error = await saveRewardSetting(
    "redeem_rewards",
    shop.rewards.filter((item) => item.id !== id),
  );
  if (error) redirect(`/admin/rewards?error=${encodeURIComponent(arabicError(error))}`);
  if (removed?.image_path) {
    const admin = createAdminClient();
    await admin.storage.from("reward-images").remove([removed.image_path]);
  }
  await logRewardChange(user.id, `Deleted reward: ${removed?.title ?? id}`);
  refreshShop();
  redirect("/admin/rewards?ok=deleted");
}
