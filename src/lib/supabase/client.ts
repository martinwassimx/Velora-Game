"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

export function createClient() {
  const env = supabaseEnv();
  if (!env) {
    throw new Error("اتصال Supabase مش متظبط");
  }
  return createBrowserClient(env.url, env.anonKey);
}
