import { createAdminClient } from "@/lib/supabase/admin";

const KEY = "first_only_task_ids";

function asIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export async function getFirstOnlyTaskIds() {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("settings").select("value").eq("key", KEY).maybeSingle();
    return new Set(asIds(data?.value));
  } catch {
    return new Set<string>();
  }
}

export async function takenFirstOnlyTaskIds(taskIds: string[]) {
  if (taskIds.length === 0) return new Set<string>();
  const admin = createAdminClient();
  const { data } = await admin
    .from("task_submissions")
    .select("task_id")
    .in("task_id", taskIds)
    .in("status", ["pending", "approved"]);
  return new Set((data ?? []).map((row) => row.task_id as string));
}

async function writeIds(ids: string[]) {
  const admin = createAdminClient();
  await admin.from("settings").upsert(
    { key: KEY, value: ids, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
}

export async function setTaskFirstOnly(taskId: string, enabled: boolean) {
  const ids = await getFirstOnlyTaskIds();
  if (enabled) ids.add(taskId);
  else ids.delete(taskId);
  await writeIds([...ids]);
}

export async function taskClaimedBySomeoneElse(taskId: string, userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("task_submissions")
    .select("user_id")
    .eq("task_id", taskId)
    .in("status", ["pending", "approved"])
    .limit(1);
  const holder = data?.[0];
  return Boolean(holder && holder.user_id !== userId);
}
