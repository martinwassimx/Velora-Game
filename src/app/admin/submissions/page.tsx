import { ReviewCard } from "@/components/admin-panels";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { signedPhoto } from "@/lib/media";
import type { PublicConfig } from "@/lib/types";

type ReviewRow = {
  id: string;
  note: string | null;
  photo_url: string | null;
  created_at: string;
  user: { username: string } | { username: string }[] | null;
  tasks: { title: string } | { title: string }[] | null;
};

function one<T>(value: T | T[] | null) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function AdminSubmissionsPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: config }] = await Promise.all([
    supabase
      .from("task_submissions")
      .select("id, note, photo_url, created_at, user:profiles!task_submissions_user_id_fkey(username), tasks(title)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase.rpc("get_public_config"),
  ]);
  const rows = (data ?? []) as ReviewRow[];
  const timeZone = (config as PublicConfig | null)?.timezone ?? "Africa/Cairo";
  const images = await Promise.all(rows.map(async (row) => ({ id: row.id, url: await signedPhoto(supabase, row.photo_url) })));
  const imageMap = new Map(images.map((item) => [item.id, item.url]));

  return (
    <div className="space-y-4">
      <PageHeader title="طلبات المهام" subtitle="المكافأة بتتضاف مرة واحدة بعد القبول بس." />
      {rows.length === 0 ? <EmptyState title="مفيش طلبات مستنية" body="لما اللاعبين يبعتوا مهام هتظهر هنا." /> : null}
      {rows.map((row) => (
        <ReviewCard
          key={row.id}
          id={row.id}
          username={one(row.user)?.username ?? "لاعب"}
          task={one(row.tasks)?.title ?? "مهمة"}
          note={row.note}
          imageUrl={imageMap.get(row.id) ?? null}
          createdAt={formatDate(row.created_at, timeZone)}
        />
      ))}
    </div>
  );
}
