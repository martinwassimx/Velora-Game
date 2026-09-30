import { redirect } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function BannedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ban } = await supabase.rpc("current_ban");
  if (!ban) redirect("/");

  const reason = typeof ban.reason === "string" ? ban.reason : "من غير سبب مكتوب";
  const expires = typeof ban.expires_at === "string" ? ban.expires_at : null;

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card max-w-lg p-6 text-center">
        <p className="text-5xl">🚫</p>
        <h1 className="mt-3 text-3xl font-black">الحساب بتاعك متوقف</h1>
        <p className="mt-3 text-lg">السبب: {reason}</p>
        <p className="mt-2 text-slate-300">
          {expires ? `الإيقاف ينتهي ${formatDate(expires)}` : "الإيقاف ده دائم"}
        </p>
        <form action={logout} className="mt-6">
          <button className="btn btn-ghost">خروج</button>
        </form>
      </div>
    </main>
  );
}
