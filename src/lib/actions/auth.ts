"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";
import { arabicError } from "@/lib/errors";
import type { ActionState } from "@/lib/types";

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "/");
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) return "/";
  return next;
}

async function authClient() {
  try {
    return await createClient();
  } catch (error) {
    throw new Error(arabicError(error instanceof Error ? error.message : null));
  }
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password" };

  try {
    const supabase = await authClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: arabicError(error.message) };
  } catch (error) {
    return { error: arabicError(error instanceof Error ? error.message : null) };
  }

  redirect(safeNext(formData.get("next")));
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (username.length < 3 || username.length > 24) return { error: "Username must be 3 to 24 characters" };
  if (/[<>]/.test(username)) return { error: "That username has characters that aren't allowed" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email isn't valid" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  if (password !== confirm) return { error: "Passwords don't match" };

  let supabase;
  try {
    supabase = await authClient();
  } catch (error) {
    return { error: arabicError(error instanceof Error ? error.message : null) };
  }
  const { data: available, error: nameError } = await supabase.rpc("username_available", {
    p_username: username,
  });
  if (nameError) return { error: arabicError(nameError.message, nameError.code) };
  if (!available) return { error: "That username is taken" };

  const origin = await siteUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: arabicError(error.message, error.code) };
  if (!data.session) {
    return { ok: "Account created. If confirmation is required, open the email, then sign in." };
  }
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email isn't valid" };

  let supabase;
  try {
    supabase = await authClient();
  } catch (error) {
    return { error: arabicError(error instanceof Error ? error.message : null) };
  }
  const origin = await siteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: arabicError(error.message) };
  return { ok: "If that email is registered, a reset link is on its way." };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  if (password !== confirm) return { error: "Passwords don't match" };

  let supabase;
  try {
    supabase = await authClient();
  } catch (error) {
    return { error: arabicError(error instanceof Error ? error.message : null) };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Open the password reset link from your email first" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: arabicError(error.message) };
  redirect("/profile?ok=password");
}
