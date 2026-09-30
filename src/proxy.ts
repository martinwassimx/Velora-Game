import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/setup"];

function isPublic(path: string) {
  return PUBLIC_PATHS.some((item) => path === item) || path.startsWith("/auth");
}

function withSessionCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const env = supabaseEnv();

  if (!env) {
    if (path === "/setup" || path === "/login" || path === "/register" || path === "/forgot-password") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo = (pathname: string, search = "") => {
    const target = request.nextUrl.clone();
    target.pathname = pathname;
    target.search = search;
    return withSessionCookies(response, NextResponse.redirect(target));
  };

  if (user && path !== "/banned" && !path.startsWith("/auth")) {
    const { data: ban, error } = await supabase.rpc("current_ban");
    if (!error && ban) return redirectTo("/banned");
  }

  if (user && path === "/banned") {
    const { data: ban, error } = await supabase.rpc("current_ban");
    if (!error && !ban) return redirectTo("/");
  }

  if (!user && !isPublic(path)) {
    const next = path.startsWith("/") && !path.startsWith("//") ? path : "/";
    return redirectTo("/login", `?next=${encodeURIComponent(next)}`);
  }

  if (user && (path === "/login" || path === "/register" || path === "/forgot-password")) {
    return redirectTo("/");
  }

  if (user && path.startsWith("/admin")) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return redirectTo("/");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
