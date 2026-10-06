"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site";
import { arabicError } from "@/lib/errors";
import { zonedInputToIso } from "@/lib/format";
import { getFirstSubmitBonuses, setFirstSubmitBonus } from "@/lib/first-bonus";
import { getFirstOnlyTaskIds, setTaskFirstOnly } from "@/lib/first-only";
import { firstSubmitterCoins } from "@/lib/tasks";
import type { ActionState } from "@/lib/types";

function refreshAdmin() {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

function readBonus(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  if (!/^\d+$/.test(raw)) return null;
  const amount = Number(raw);
  if (!Number.isSafeInteger(amount) || amount > 1000000) return null;
  return amount;
}

export async function saveTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const idValue = String(formData.get("id") ?? "");
  const assignees = formData.getAll("assignees").map(String).filter(Boolean);
  const payload = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    instructions: String(formData.get("instructions") ?? ""),
    difficulty: String(formData.get("difficulty") ?? "easy"),
    xp_reward: String(formData.get("xp_reward") ?? "0"),
    coin_reward: String(formData.get("coin_reward") ?? "0"),
    deadline: String(formData.get("deadline") ?? ""),
    requires_photo: formData.get("requires_photo") === "on",
    max_submissions: String(formData.get("max_submissions") ?? "1"),
    allow_resubmission: formData.get("allow_resubmission") === "on",
    is_active: formData.get("is_active") === "on",
    assign_to: String(formData.get("assign_to") ?? "everyone"),
  };

  const firstBonus = readBonus(formData.get("first_coin_bonus"));
  if (firstBonus === null) return { error: "The first-player bonus must be a whole number from 0 to 1000000" };
  const coinReward = Number(payload.coin_reward);
  if (Number.isInteger(coinReward) && coinReward + firstBonus > 1000000) return { error: "That first-player bonus is too large" };

  const { data, error } = await supabase.rpc("admin_save_task", {
    p_id: idValue || null,
    p_payload: payload,
    p_user_ids: assignees,
  });
  if (error) return { error: arabicError(error.message) };
  await setTaskFirstOnly(String(data), formData.get("first_only") === "on");
  await setFirstSubmitBonus(String(data), firstBonus);

  refreshAdmin();
  redirect(`/admin/tasks/${data}`);
}

export async function deleteTask(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.rpc("admin_delete_task", { p_id: id });
  if (error) redirect(`/admin/tasks/${id}?error=${encodeURIComponent(arabicError(error.message))}`);
  await setTaskFirstOnly(id, false);
  await setFirstSubmitBonus(id, null);
  refreshAdmin();
  redirect("/admin/tasks?ok=deleted");
}

export async function duplicateTask(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { data, error } = await supabase.rpc("admin_duplicate_task", { p_id: id });
  if (error) redirect(`/admin/tasks/${id}?error=${encodeURIComponent(arabicError(error.message))}`);
  const firstOnly = await getFirstOnlyTaskIds();
  if (firstOnly.has(id)) await setTaskFirstOnly(String(data), true);
  const firstBonuses = await getFirstSubmitBonuses();
  if (firstBonuses.has(id)) await setFirstSubmitBonus(String(data), firstBonuses.get(id)!);
  refreshAdmin();
  redirect(`/admin/tasks/${data}`);
}

export async function reviewSubmission(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const approve = String(formData.get("decision") ?? "") === "approve";
  const reason = String(formData.get("reason") ?? "").trim();
  const bonusXp = approve ? readBonus(formData.get("bonus_xp")) : 0;
  const bonusCoins = approve ? readBonus(formData.get("bonus_coins")) : 0;
  if (bonusXp === null || bonusCoins === null) return { error: "The bonus must be a whole number from 0 to 1000000" };
  const admin = createAdminClient();
  const { data: submission } = await admin
    .from("task_submissions")
    .select("id, user_id, task_id, created_at, status, reward_granted, tasks(title, xp_reward, coin_reward)")
    .eq("id", id)
    .maybeSingle();
  const task = Array.isArray(submission?.tasks) ? submission.tasks[0] : submission?.tasks;
  if (!submission || !task) return { error: "That submission doesn't exist" };
  if (submission.status !== "pending" || submission.reward_granted) return { error: "That submission was already reviewed" };

  if (!approve && (reason.length < 2 || reason.length > 400)) {
    return { error: reason.length > 400 ? "That rejection reason is too long" : "Write a rejection reason" };
  }

  const { data: firstRow } = await admin
    .from("task_submissions")
    .select("id")
    .eq("task_id", submission.task_id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  const firstSubmit = firstRow?.id === submission.id;
  const firstBonuses = await getFirstSubmitBonuses();
  const firstExtra = firstBonuses.has(submission.task_id) ? firstBonuses.get(submission.task_id)! : task.coin_reward;
  const baseCoins = firstSubmit ? firstSubmitterCoins(task.coin_reward, firstExtra) : task.coin_reward;
  const xp = task.xp_reward + bonusXp;
  const coins = baseCoins + bonusCoins;
  if (xp > 1000000 || coins > 1000000) return { error: "That bonus is too large" };

  const reviewedAt = new Date().toISOString();
  const { data: updated } = await admin
    .from("task_submissions")
    .update({
      status: approve ? "approved" : "rejected",
      reward_granted: approve,
      reviewed_by: user.id,
      reviewed_at: reviewedAt,
      rejection_reason: approve ? null : reason,
    })
    .eq("id", id)
    .eq("status", "pending")
    .eq("reward_granted", false)
    .select("id")
    .maybeSingle();
  if (!updated) return { error: "That submission was already reviewed" };

  if (approve) {
    const { error: rewardError } = await admin.rpc("grant_rewards", {
      p_user: submission.user_id,
      p_xp: xp,
      p_coins: coins,
      p_increment_completed: true,
    });
    if (rewardError) {
      await admin
        .from("task_submissions")
        .update({ status: "pending", reward_granted: false, reviewed_by: null, reviewed_at: null, rejection_reason: null })
        .eq("id", id);
      return { error: arabicError(rewardError.message) };
    }
  }

  await admin.from("notifications").insert({
    user_id: submission.user_id,
    title: approve ? "Mission approved" : "Mission rejected",
    body: approve
      ? `${task.title} was approved. You earned ${xp} XP and ${coins} coins.${firstSubmit && firstExtra > 0 ? ` You were the first to submit, so you earned ${firstExtra} extra coins.` : ""}${bonusXp > 0 || bonusCoins > 0 ? ` That includes a bonus of ${bonusXp} XP and ${bonusCoins} coins for a strong answer.` : ""}`
      : `${task.title} was rejected. Reason: ${reason}`,
    type: approve ? "submission_approved" : "submission_rejected",
  });
  await admin.from("admin_logs").insert({
    admin_id: user.id,
    action: approve ? "submission_approved" : "submission_rejected",
    target_type: "submission",
    target_id: id,
    description: `${approve ? "Approved" : "Rejected"} mission: ${task.title}`,
    metadata: approve
      ? { user_id: submission.user_id, xp, coins, bonus_xp: bonusXp, bonus_coins: bonusCoins, first_submit: firstSubmit, first_extra: firstExtra }
      : { user_id: submission.user_id, reason },
  });

  refreshAdmin();
  revalidatePath("/admin/submissions");
  return {
    ok: approve
      ? bonusXp > 0 || bonusCoins > 0
        ? `Mission approved. The player earned ${xp} XP and ${coins} coins, including a bonus of ${bonusXp} XP and ${bonusCoins} coins.`
        : firstSubmit && firstExtra > 0
          ? `Mission approved. This was the first submission, so they earned ${firstExtra} extra coins.`
          : "Mission approved, and the player was rewarded"
      : "Mission rejected",
  };
}

export async function adjustXp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const delta = Number(formData.get("delta"));
  if (!Number.isInteger(delta) || delta === 0) return { error: "Enter a non-zero whole number" };
  const { error } = await supabase.rpc("admin_adjust_xp", { p_user: userId, p_delta: delta });
  if (error) return { error: arabicError(error.message) };
  refreshAdmin();
  return { ok: delta > 0 ? "XP was added" : "XP was removed" };
}

export async function adjustCoins(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const delta = Number(formData.get("delta"));
  if (!Number.isInteger(delta) || delta === 0) return { error: "Enter a non-zero whole number" };
  const { error } = await supabase.rpc("admin_adjust_coins", { p_user: userId, p_delta: delta });
  if (error) return { error: arabicError(error.message) };
  refreshAdmin();
  return { ok: delta > 0 ? "Coins were added" : "Coins were removed" };
}

export async function resetStreak(formData: FormData) {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const { error } = await supabase.rpc("admin_reset_streak", { p_user: userId });
  if (error) redirect(`/admin/users/${userId}?error=${encodeURIComponent(arabicError(error.message))}`);
  refreshAdmin();
  redirect(`/admin/users/${userId}?ok=streak`);
}

export async function setUsername(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const username = String(formData.get("username") ?? "");
  const { error } = await supabase.rpc("admin_set_username", { p_user: userId, p_username: username });
  if (error) return { error: arabicError(error.message) };
  refreshAdmin();
  return { ok: "The username was changed" };
}

export async function setRole(formData: FormData) {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "user");
  const { error } = await supabase.rpc("admin_set_role", { p_user: userId, p_role: role });
  if (error) redirect(`/admin/users/${userId}?error=${encodeURIComponent(arabicError(error.message))}`);
  refreshAdmin();
  redirect(`/admin/users/${userId}?ok=role`);
}

export async function banUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const permanent = formData.get("permanent") === "on";
  const expires = String(formData.get("expires_at") ?? "");
  const { data: config } = await supabase.rpc("get_public_config");
  const timeZone = typeof config?.timezone === "string" ? config.timezone : "Africa/Cairo";
  const { error } = await supabase.rpc("admin_ban_user", {
    p_user: userId,
    p_reason: reason,
    p_expires_at: permanent || !expires ? null : zonedInputToIso(expires, timeZone),
  });
  if (error) return { error: arabicError(error.message) };
  refreshAdmin();
  return { ok: "The account was suspended" };
}

export async function unbanUser(formData: FormData) {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const { error } = await supabase.rpc("admin_unban_user", { p_user: userId });
  if (error) redirect(`/admin/users/${userId}?error=${encodeURIComponent(arabicError(error.message))}`);
  refreshAdmin();
  redirect(`/admin/users/${userId}?ok=unban`);
}

export async function removeUser(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const username = String(formData.get("username") ?? "");
  const email = String(formData.get("email") ?? "");
  if (userId === user.id) {
    redirect(`/admin/users/${userId}?error=${encodeURIComponent("You can't delete your own account")}`);
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      redirect(`/admin/users/${userId}?error=${encodeURIComponent("We couldn't delete the account. Check the service role key.")}`);
    }
  } catch {
    redirect(`/admin/users/${userId}?error=${encodeURIComponent("The service role key is not set on the server")}`);
  }

  await supabase.rpc("admin_log_user_deleted", {
    p_user: userId,
    p_username: username,
    p_email: email,
  });
  refreshAdmin();
  redirect("/admin/users?ok=deleted");
}

export async function sendPasswordReset(formData: FormData) {
  const { supabase } = await requireAdmin();
  const email = String(formData.get("email") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const origin = await siteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) redirect(`/admin/users/${userId}?error=${encodeURIComponent(arabicError(error.message))}`);
  await supabase.rpc("admin_log_password_reset", { p_user: userId, p_email: email });
  redirect(`/admin/users/${userId}?ok=reset`);
}

export async function sendNotification(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const audience = String(formData.get("audience") ?? "all");
  const userId = String(formData.get("user_id") ?? "");
  const { error } = await supabase.rpc("admin_send_notification", {
    p_user: audience === "user" ? userId : null,
    p_title: String(formData.get("title") ?? ""),
    p_body: String(formData.get("body") ?? ""),
  });
  if (error) return { error: arabicError(error.message) };
  refreshAdmin();
  return { ok: audience === "user" ? "The notification was sent to the player" : "The notification was sent to everyone" };
}

export async function saveAchievement(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payload = {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    icon: String(formData.get("icon") ?? "trophy"),
    condition_type: String(formData.get("condition_type") ?? ""),
    condition_value: String(formData.get("condition_value") ?? ""),
    is_active: formData.get("is_active") === "on",
  };
  const { error } = await supabase.rpc("admin_save_achievement", {
    p_id: id || null,
    p_payload: payload,
  });
  if (error) return { error: arabicError(error.message) };
  refreshAdmin();
  redirect("/admin/achievements?ok=saved");
}

export async function deleteAchievement(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.rpc("admin_delete_achievement", { p_id: id });
  if (error) redirect(`/admin/achievements?error=${encodeURIComponent(arabicError(error.message))}`);
  refreshAdmin();
  redirect("/admin/achievements?ok=deleted");
}

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const thresholds = String(formData.get("level_thresholds") ?? "")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number);
  const dailyRewards = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
    day,
    coins: Number(formData.get(`reward_${day}`) ?? 0),
  }));
  if (thresholds.some((value) => !Number.isInteger(value))) {
    return { error: "XP levels must be whole numbers" };
  }
  if (thresholds.length < 2 || thresholds.length > 50) {
    return { error: "Enter between 2 and 50 levels" };
  }
  if (thresholds[0] !== 0) {
    return { error: "The first level must start at 0 XP" };
  }
  if (thresholds.some((value, index) => index > 0 && value <= thresholds[index - 1])) {
    return { error: "Each level must be higher than the one before it" };
  }
  if (thresholds.some((value) => value > 100000000)) {
    return { error: "That XP value is too large" };
  }
  if (dailyRewards.some((reward) => !Number.isInteger(reward.coins) || reward.coins < 0 || reward.coins > 1000000)) {
    return { error: "Daily rewards must be whole numbers" };
  }
  const timezone = String(formData.get("timezone") ?? "Africa/Cairo").trim() || "Africa/Cairo";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    return { error: "That time zone isn't valid" };
  }
  const difficultyDefaults = {
    easy: { xp: Number(formData.get("easy_xp")), coins: Number(formData.get("easy_coins")) },
    medium: { xp: Number(formData.get("medium_xp")), coins: Number(formData.get("medium_coins")) },
    hard: { xp: Number(formData.get("hard_xp")), coins: Number(formData.get("hard_coins")) },
    legendary: { xp: Number(formData.get("legendary_xp")), coins: Number(formData.get("legendary_coins")) },
  };
  const rewardValues = Object.values(difficultyDefaults).flatMap((item) => [item.xp, item.coins]);
  if (rewardValues.some((value) => !Number.isInteger(value) || value < 0)) {
    return { error: "Difficulty rewards must be whole numbers" };
  }
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: settingsError } = await admin.from("settings").upsert(
    [
      { key: "leaderboard_enabled", value: formData.get("leaderboard_enabled") === "on", updated_at: now },
      { key: "streak_reset_on_miss", value: formData.get("streak_reset_on_miss") === "on", updated_at: now },
      { key: "timezone", value: timezone, updated_at: now },
      { key: "level_thresholds", value: thresholds, updated_at: now },
      { key: "difficulty_defaults", value: difficultyDefaults, updated_at: now },
    ],
    { onConflict: "key" },
  );
  if (settingsError) return { error: arabicError(settingsError.message) };

  const { error: rewardsError } = await admin.from("daily_login_rewards").upsert(
    dailyRewards.map((reward) => ({ day_number: reward.day, coins: reward.coins })),
    { onConflict: "day_number" },
  );
  if (rewardsError) return { error: arabicError(rewardsError.message) };

  await admin.from("admin_logs").insert({
    admin_id: user.id,
    action: "settings_updated",
    target_type: "settings",
    description: "Updated game settings",
    metadata: {
      timezone,
      level_thresholds: thresholds,
      daily_rewards: dailyRewards,
      difficulty_defaults: difficultyDefaults,
    },
  });

  refreshAdmin();
  return { ok: "Settings were saved" };
}
