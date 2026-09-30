import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DailyClaim, Profile } from "@/lib/types";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ban, error: banError } = await supabase.rpc("current_ban");
  if (!banError && ban) redirect("/banned");

  await supabase.rpc("claim_daily_reward");
  await supabase.rpc("touch_session");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/login?error=profile");

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return {
    supabase,
    user,
    profile: profile as Profile,
    unread: count ?? 0,
    claim: null as DailyClaim | null,
  };
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.profile.role !== "admin") redirect("/");
  return ctx;
}
