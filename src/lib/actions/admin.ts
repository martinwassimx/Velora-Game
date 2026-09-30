"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site";
import { arabicError } from "@/lib/errors";
import { zonedInputToIso } from "@/lib/format";
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

  const { data, error } = await supabase.rpc("admin_save_task", {
    p_id: idValue || null,
    p_payload: payload,
    p_user_ids: assignees,
  });
  if (error) return { error: arabicError(error.message) };
  await setTaskFirstOnly(String(data), formData.get("first_only") === "on");

  refreshAdmin();
  redirect(`/admin/tasks/${data}`);
}

export async function deleteTask(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.rpc("admin_delete_task", { p_id: id });
  if (error) redirect(`/admin/tasks/${id}?error=${encodeURIComponent(arabicError(error.message))}`);
  await setTaskFirstOnly(id, false);
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
  if (bonusXp === null || bonusCoins === null) return { error: "البونص لازم يكون رقم من 0 لحد 1000000" };
  const admin = createAdminClient();
  const { data: submission } = await admin
    .from("task_submissions")
    .select("id, user_id, task_id, created_at, status, reward_granted, tasks(title, xp_reward, coin_reward)")
    .eq("id", id)
    .maybeSingle();
  const task = Array.isArray(submission?.tasks) ? submission.tasks[0] : submission?.tasks;
  if (!submission || !task) return { error: "الطلب مش موجود" };
  if (submission.status !== "pending" || submission.reward_granted) return { error: "الطلب ده اتراجع قبل كده" };

  if (!approve && (reason.length < 2 || reason.length > 400)) {
    return { error: reason.length > 400 ? "سبب الرفض طويل أوي" : "اكتب سبب الرفض" };
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
  const baseCoins = firstSubmit ? firstSubmitterCoins(task.coin_reward) : task.coin_reward;
  const xp = task.xp_reward + bonusXp;
  const coins = baseCoins + bonusCoins;
  if (xp > 1000000 || coins > 1000000) return { error: "البونص كبير أوي" };

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
  if (!updated) return { error: "الطلب ده اتراجع قبل كده" };

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
    title: approve ? "✅ المهمة اتقبلت" : "❌ المهمة اترفضت",
    body: approve
      ? `اتقبلت «${task.title}» وخدت ${xp} XP و ${coins} كوين.${firstSubmit && baseCoins > task.coin_reward ? " أول واحد بعت المهمة، فالكوينز اتضاعفت." : ""}${bonusXp > 0 || bonusCoins > 0 ? ` وبونص ${bonusXp} XP و ${bonusCoins} كوين عشان الإجابة كانت حلوة.` : ""}`
      : `اترفضت «${task.title}». السبب: ${reason}`,
    type: approve ? "submission_approved" : "submission_rejected",
  });
  await admin.from("admin_logs").insert({
    admin_id: user.id,
    action: approve ? "submission_approved" : "submission_rejected",
    target_type: "submission",
    target_id: id,
    description: `${approve ? "قبول" : "رفض"} مهمة: ${task.title}`,
    metadata: approve
      ? { user_id: submission.user_id, xp, coins, bonus_xp: bonusXp, bonus_coins: bonusCoins, first_submit: firstSubmit }
      : { user_id: submission.user_id, reason },
  });

  refreshAdmin();
  revalidatePath("/admin/submissions");
  return {
    ok: approve
      ? bonusXp > 0 || bonusCoins > 0
        ? `اتقبلت المهمة. اللاعب خد ${xp} XP و ${coins} كوين، منهم بونص ${bonusXp} XP و ${bonusCoins} كوين.`
        : firstSubmit && baseCoins > task.coin_reward
          ? "اتقبلت المهمة. أول تسليم، فالكوينز اتضاعفت."
          : "اتقبلت المهمة واتكافأ اللاعب"
      : "اترفضت المهمة",
  };
}

export async function adjustXp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const delta = Number(formData.get("delta"));
  if (!Number.isInteger(delta) || delta === 0) return { error: "اكتب رقم صحيح غير صفر" };
  const { error } = await supabase.rpc("admin_adjust_xp", { p_user: userId, p_delta: delta });
  if (error) return { error: arabicError(error.message) };
  refreshAdmin();
  return { ok: delta > 0 ? "اتضاف الـ XP" : "اتخصم الـ XP" };
}

export async function adjustCoins(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const delta = Number(formData.get("delta"));
  if (!Number.isInteger(delta) || delta === 0) return { error: "اكتب رقم صحيح غير صفر" };
  const { error } = await supabase.rpc("admin_adjust_coins", { p_user: userId, p_delta: delta });
  if (error) return { error: arabicError(error.message) };
  refreshAdmin();
  return { ok: delta > 0 ? "اتضافت الكوينز" : "اتخصمت الكوينز" };
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
  return { ok: "اتغير اسم المستخدم" };
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
  return { ok: "الحساب اتوقف" };
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
    redirect(`/admin/users/${userId}?error=${encodeURIComponent("متقدرش تمسح حسابك")}`);
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      redirect(`/admin/users/${userId}?error=${encodeURIComponent("مقدرناش نمسح الحساب. اتأكد من مفتاح الخدمة.")}`);
    }
  } catch {
    redirect(`/admin/users/${userId}?error=${encodeURIComponent("مفتاح الخدمة مش متظبط على السيرفر")}`);
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
  return { ok: audience === "user" ? "الإشعار اتبعت للاعب" : "الإشعار اتبعت للكل" };
}

export async function saveAchievement(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payload = {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    icon: String(formData.get("icon") ?? "🏆"),
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
    return { error: "مستويات الـ XP لازم تكون أرقام صحيحة" };
  }
  if (thresholds.length < 2 || thresholds.length > 50) {
    return { error: "حط من مستويين لـ 50 مستوى" };
  }
  if (thresholds[0] !== 0) {
    return { error: "أول مستوى لازم يبدأ من 0 XP" };
  }
  if (thresholds.some((value, index) => index > 0 && value <= thresholds[index - 1])) {
    return { error: "كل مستوى لازم يكون أعلى من اللي قبله" };
  }
  if (thresholds.some((value) => value > 100000000)) {
    return { error: "قيمة الـ XP كبيرة أوي" };
  }
  if (dailyRewards.some((reward) => !Number.isInteger(reward.coins) || reward.coins < 0 || reward.coins > 1000000)) {
    return { error: "مكافآت الدخول لازم تكون أرقام" };
  }
  const timezone = String(formData.get("timezone") ?? "Africa/Cairo").trim() || "Africa/Cairo";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    return { error: "المنطقة الزمنية مش صحيحة" };
  }
  const difficultyDefaults = {
    easy: { xp: Number(formData.get("easy_xp")), coins: Number(formData.get("easy_coins")) },
    medium: { xp: Number(formData.get("medium_xp")), coins: Number(formData.get("medium_coins")) },
    hard: { xp: Number(formData.get("hard_xp")), coins: Number(formData.get("hard_coins")) },
    legendary: { xp: Number(formData.get("legendary_xp")), coins: Number(formData.get("legendary_coins")) },
  };
  const rewardValues = Object.values(difficultyDefaults).flatMap((item) => [item.xp, item.coins]);
  if (rewardValues.some((value) => !Number.isInteger(value) || value < 0)) {
    return { error: "مكافآت الصعوبة لازم تكون أرقام" };
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
    description: "تحديث إعدادات اللعبة",
    metadata: {
      timezone,
      level_thresholds: thresholds,
      daily_rewards: dailyRewards,
      difficulty_defaults: difficultyDefaults,
    },
  });

  refreshAdmin();
  return { ok: "الإعدادات اتحفظت" };
}
