import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { TaskSubmitForm } from "@/components/player-forms";
import { Alert } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { DIFFICULTY_LABEL, STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import { signedPhoto } from "@/lib/media";
import { firstSubmitBonus, getFirstSubmitBonuses } from "@/lib/first-bonus";
import { getFirstOnlyTaskIds, taskClaimedBySomeoneElse } from "@/lib/first-only";
import { describeTask, firstSubmitterCoins } from "@/lib/tasks";
import type { PublicConfig, Submission, Task } from "@/lib/types";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireUser();
  const [{ data: task }, { data: submissions }, { data: config }] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).maybeSingle(),
    supabase.from("task_submissions").select("*").eq("user_id", profile.id).eq("task_id", id).order("created_at", { ascending: false }),
    supabase.rpc("get_public_config"),
  ]);
  if (!task) notFound();

  const current = task as Task;
  const rows = (submissions ?? []) as Submission[];
  const [firstOnlyIds, firstBonuses] = await Promise.all([getFirstOnlyTaskIds(), getFirstSubmitBonuses()]);
  const firstExtra = firstSubmitBonus(firstBonuses, current.id, current.coin_reward);
  const firstOnly = firstOnlyIds.has(current.id);
  const claimed = firstOnly ? await taskClaimedBySomeoneElse(current.id, profile.id) : false;
  const info = describeTask(current, rows, claimed);
  const settings = config as PublicConfig | null;
  const timeZone = settings?.timezone ?? "Africa/Cairo";
  const photos = await Promise.all(rows.map(async (row) => ({ id: row.id, url: await signedPhoto(supabase, row.photo_url) })));
  const photoMap = new Map(photos.map((item) => [item.id, item.url]));

  return (
    <div className="space-y-4">
      <Link href="/tasks" className="text-sm font-bold text-[#e4e4e7]">
        Back to missions
      </Link>
      <section className="card p-5">
        <div className="flex flex-wrap gap-2">
          <span className="chip">{DIFFICULTY_LABEL[current.difficulty]}</span>
          <span className="chip"><Icon name="zap" className="h-3.5 w-3.5" /> {formatNumber(current.xp_reward)} XP</span>
          <span className="chip">
            <Icon name="coin" className="h-3.5 w-3.5" /> {formatNumber(current.coin_reward)}
            {firstExtra > 0 ? ` · First player ${formatNumber(firstSubmitterCoins(current.coin_reward, firstExtra))}` : ""}
          </span>
          <span className="chip">{STATUS_LABEL[info.state] ?? "Open"}</span>
        </div>
        <h1 className="mt-3 text-3xl font-black">{current.title}</h1>
        <p className="mt-3 leading-8 text-[#d4d4d8]">{current.description || "No description"}</p>
        {current.instructions ? (
          <div className="mt-4 rounded-2xl bg-[#18181b] p-4 leading-8">
            <p className="font-extrabold">Instructions</p>
            <p>{current.instructions}</p>
          </div>
        ) : null}
        <p className="mt-4 text-sm text-[#a1a1aa]">
          Deadline: {current.deadline ? formatDate(current.deadline, timeZone) : "No deadline"} · Created {formatDate(current.created_at, timeZone)}
        </p>
        {firstExtra > 0 ? (
          <p className="mt-2 text-sm text-[#e4e4e7]">
            The first player to submit earns {formatNumber(firstExtra)} extra coins. Everyone else earns {formatNumber(current.coin_reward)}.
          </p>
        ) : null}
        {firstOnly ? <p className="mt-2 text-sm text-[#e4e4e7]">Only the first player can take this mission. After someone submits it, it closes for everyone else.</p> : null}
        {current.requires_photo ? <p className="mt-2 text-sm text-[#e4e4e7]">This mission needs a photo.</p> : null}
      </section>

      {info.canSubmit ? (
        <TaskSubmitForm taskId={current.id} requiresPhoto={current.requires_photo} />
      ) : (
        <Alert tone="info">
          {info.state === "pending"
            ? "This mission is in review. The reward is added after an admin approves it."
            : info.state === "approved"
              ? "This mission was approved."
              : info.state === "rejected"
                ? "This mission was rejected, and you can't submit it again."
                : info.state === "taken"
              ? "Only the first player can take this mission, and someone already did."
            : info.state === "expired"
                  ? "This mission has expired."
                  : "This mission isn't available right now."}
        </Alert>
      )}

      {rows.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold">Your submissions</h2>
          {rows.map((row) => (
            <article key={row.id} className="card p-4">
              <p className="font-extrabold">{STATUS_LABEL[row.status]}</p>
              <p className="text-sm text-[#a1a1aa]">{formatDate(row.created_at, timeZone)}</p>
              {row.note ? <p className="mt-2 leading-7">{row.note}</p> : null}
              {row.rejection_reason ? <p className="mt-2 text-rose-200">Reason: {row.rejection_reason}</p> : null}
              {photoMap.get(row.id) ? <img src={photoMap.get(row.id) ?? ""} alt="Submission photo" className="mt-3 max-h-80 w-full rounded-2xl object-contain" /> : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
