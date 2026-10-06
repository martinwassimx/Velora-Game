import Link from "next/link";
import { Icon, Mark } from "@/components/icons";
import { PasswordForm, ProfileForm } from "@/components/player-forms";
import { Alert, Avatar, PageHeader, Stat, XpBar } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { englishCopy } from "@/lib/copy";
import { formatDay, formatNumber } from "@/lib/format";
import type { LevelProgress } from "@/lib/types";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const params = await searchParams;
  const { supabase, profile } = await requireUser();
  const [{ data: progress }, { data: unlocked }] = await Promise.all([
    supabase.rpc("level_for_xp", { p_xp: profile.xp }),
    supabase.from("user_achievements").select("id, achievements(icon, title)").eq("user_id", profile.id).order("unlocked_at", { ascending: false }).limit(6),
  ]);
  const level = (progress as LevelProgress | null) ?? {
    level: profile.level,
    floor_xp: 0,
    next_xp: Math.max(profile.xp + 100, 1),
    xp: profile.xp,
  };
  const badges = (unlocked ?? []) as { id: string; achievements: { icon: string; title: string } | { icon: string; title: string }[] | null }[];

  return (
    <div className="space-y-4">
      <PageHeader title="Profile" subtitle="Your details and achievements." />
      {params.ok === "password" ? <Alert tone="ok">Your password was changed.</Alert> : null}
      <section className="card flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:text-start">
        <Avatar name={profile.username} path={profile.avatar_url} size="lg" />
        <div className="w-full">
          <h2 className="text-2xl font-black">{profile.username}</h2>
          <p className="text-[#a1a1aa]">Joined {formatDay(profile.created_at)}</p>
          <div className="mt-4">
            <XpBar level={level.level} xp={level.xp} floorXp={level.floor_xp} nextXp={level.next_xp} />
          </div>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat icon={<Icon name="star" />} label="Level" value={formatNumber(profile.level)} />
        <Stat icon={<Icon name="zap" />} label="XP" value={formatNumber(profile.xp)} />
        <Stat icon={<Icon name="coin" />} label="Coins" value={formatNumber(profile.coins)} />
        <Stat icon={<Icon name="flame" />} label="Current streak" value={`${formatNumber(profile.current_streak)} days`} />
        <Stat icon={<Icon name="star" />} label="Longest streak" value={`${formatNumber(profile.longest_streak)} days`} />
        <Stat icon={<Icon name="check" />} label="Completed missions" value={formatNumber(profile.total_completed_tasks)} />
        <Stat icon={<Icon name="upload" />} label="All submissions" value={formatNumber(profile.total_submitted_tasks)} />
      </section>
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-extrabold">Badges</h2>
          <Link href="/achievements" className="text-sm font-bold text-[#e4e4e7]">All achievements</Link>
        </div>
        {badges.length === 0 ? <p className="text-[#a1a1aa]">No badges yet. Finish your first mission.</p> : (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => {
              const item = Array.isArray(badge.achievements) ? badge.achievements[0] : badge.achievements;
              if (!item) return null;
              return <span key={badge.id} className="chip"><Mark value={item.icon} /> {englishCopy(item.title)}</span>;
            })}
          </div>
        )}
      </section>
      <div className="flex gap-3 text-sm font-bold">
        <Link href="/submissions" className="text-[#e4e4e7]">My submissions</Link>
        <Link href="/notifications" className="text-[#e4e4e7]">Notifications</Link>
      </div>
      <ProfileForm username={profile.username} />
      <PasswordForm />
    </div>
  );
}
