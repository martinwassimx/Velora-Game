"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { arabicError } from "@/lib/errors";
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
  if (!user) return { error: "لازم تسجل دخول" };

  const taskId = String(formData.get("task_id") ?? "");
  const note = String(formData.get("note") ?? "");
  const file = formData.get("photo");
  let path: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { error: "الصورة لازم تكون أقل من 5 ميجا" };
    const ext = PHOTO_TYPES[file.type];
    if (!ext) return { error: "الصورة لازم تكون JPG أو PNG أو WEBP" };
    path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from("task-submissions").upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) return { error: "مقدرناش نرفع الصورة، جرّب تاني" };
  }

  const { error } = await supabase.rpc("submit_task", {
    p_task_id: taskId,
    p_photo_path: path,
    p_note: note,
  });

  if (error) {
    if (path) await supabase.storage.from("task-submissions").remove([path]);
    return { error: arabicError(error.message) };
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/submissions");
  revalidatePath("/notifications");
  return { ok: "المهمة مستنية المراجعة" };
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "لازم تسجل دخول" };

  const username = String(formData.get("username") ?? "").trim();
  if (username.length < 3 || username.length > 24) return { error: "اسم المستخدم لازم يكون من 3 لـ 24 حرف" };
  if (/[<>]/.test(username)) return { error: "اسم المستخدم فيه رموز مش مسموحة" };

  const file = formData.get("avatar");
  let avatarPath: string | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) return { error: "صورة البروفايل لازم تكون أقل من 2 ميجا" };
    const ext = PHOTO_TYPES[file.type];
    if (!ext) return { error: "الصورة لازم تكون JPG أو PNG أو WEBP" };
    avatarPath = `${user.id}/avatar.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from("avatars").upload(avatarPath, bytes, {
      contentType: file.type,
      upsert: true,
    });
    if (uploadError) return { error: "مقدرناش نرفع الصورة" };
  }

  const patch: { username: string; avatar_url?: string } = { username };
  if (avatarPath) patch.avatar_url = avatarPath;

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { error: arabicError(error.message) };

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return { ok: "تم حفظ البروفايل" };
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
