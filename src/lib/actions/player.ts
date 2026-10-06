"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { arabicError } from "@/lib/errors";
import { getFirstOnlyTaskIds, taskClaimedBySomeoneElse } from "@/lib/first-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/types";

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function submitTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Sign in to continue" };

  const taskId = String(formData.get("task_id") ?? "");
  const note = String(formData.get("note") ?? "");
  const file = formData.get("photo");
  const firstOnly = await getFirstOnlyTaskIds();
  if (firstOnly.has(taskId) && (await taskClaimedBySomeoneElse(taskId, user.id))) {
    return { error: "Only the first player can take this mission, and someone already did." };
  }
  let path: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { error: "The photo must be under 5 MB" };
    const ext = PHOTO_TYPES[file.type];
    if (!ext) return { error: "Use a JPG, PNG, or WEBP photo" };
    path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from("task-submissions").upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) return { error: "The photo didn't upload. Try again." };
  }

  const { data: submissionId, error } = await supabase.rpc("submit_task", {
    p_task_id: taskId,
    p_photo_path: path,
    p_note: note,
  });

  if (error) {
    if (path) await supabase.storage.from("task-submissions").remove([path]);
    return { error: arabicError(error.message) };
  }

  if (firstOnly.has(taskId) && submissionId) {
    const admin = createAdminClient();
    const { data: holders } = await admin
      .from("task_submissions")
      .select("id, user_id")
      .eq("task_id", taskId)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(1);
    const holder = holders?.[0];
    if (holder && holder.id !== submissionId && holder.user_id !== user.id) {
      await admin.from("task_submissions").delete().eq("id", submissionId);
      if (path) await supabase.storage.from("task-submissions").remove([path]);
      return { error: "Only the first player can take this mission, and someone already did." };
    }
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/submissions");
  revalidatePath("/notifications");
  return { ok: "Mission sent for review" };
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Sign in to continue" };

  const username = String(formData.get("username") ?? "").trim();
  if (username.length < 3 || username.length > 24) return { error: "Username must be 3 to 24 characters" };
  if (/[<>]/.test(username)) return { error: "That username has characters that aren't allowed" };

  const file = formData.get("avatar");
  let avatarPath: string | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) return { error: "The profile photo must be under 2 MB" };
    const ext = PHOTO_TYPES[file.type];
    if (!ext) return { error: "Use a JPG, PNG, or WEBP photo" };
    avatarPath = `${user.id}/avatar.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from("avatars").upload(avatarPath, bytes, {
      contentType: file.type,
      upsert: true,
    });
    if (uploadError) return { error: "The photo didn't upload" };
  }

  const patch: { username: string; avatar_url?: string } = { username };
  if (avatarPath) patch.avatar_url = avatarPath;

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { error: arabicError(error.message) };

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return { ok: "Profile saved" };
}

export async function markNotificationRead(formData: FormData) {
  const { supabase, user } = await currentUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
}

export async function dismissNotice(formData: FormData) {
  await markNotificationRead(formData);
}
