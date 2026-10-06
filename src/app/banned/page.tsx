import { Icon } from "@/components/icons";
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

  const reason = typeof ban.reason === "string" ? ban.reason : "No reason was given";
  const expires = typeof ban.expires_at === "string" ? ban.expires_at : null;

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card max-w-lg p-6 text-center">
        <Icon name="ban" className="mx-auto h-8 w-8" />
        <h1 className="mt-3 text-3xl font-black">This account is suspended</h1>
        <p className="mt-3 text-lg">Reason: {reason}</p>
        <p className="mt-2 text-[#a1a1aa]">
          {expires ? `The suspension ends ${formatDate(expires)}` : "This suspension is permanent"}
        </p>
        <form action={logout} className="mt-6">
          <button className="btn btn-ghost">Sign out</button>
        </form>
      </div>
    </main>
  );
}
