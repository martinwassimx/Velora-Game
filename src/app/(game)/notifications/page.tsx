import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/player";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { englishCopy } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import type { NotificationItem, PublicConfig } from "@/lib/types";

export default async function NotificationsPage() {
  const { supabase, user } = await requireUser();
  const [{ data }, { data: config }] = await Promise.all([
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
    supabase.rpc("get_public_config"),
  ]);
  const rows = (data ?? []) as NotificationItem[];
  const timeZone = (config as PublicConfig | null)?.timezone ?? "Africa/Cairo";

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Rewards, levels, and mission decisions."
        action={
          <form action={markAllNotificationsRead}>
            <button className="btn btn-ghost">Mark all as read</button>
          </form>
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="No notifications" body="When something important happens, it will show up here." />
      ) : (
        <div className="grid gap-3">
          {rows.map((item) => (
            <article key={item.id} className={`card p-4 ${item.is_read ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold">{englishCopy(item.title)}</h2>
                  <p className="mt-1 leading-7 text-[#d4d4d8]">{englishCopy(item.body)}</p>
                  <p className="mt-2 text-xs text-[#a1a1aa]">{formatDate(item.created_at, timeZone)}</p>
                </div>
                {!item.is_read ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="text-sm font-bold text-[#e4e4e7]">Mark read</button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
