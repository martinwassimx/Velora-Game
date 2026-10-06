"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { Icon, type IconName } from "@/components/icons";
import { Avatar, BrandMark } from "@/components/ui";
import type { LevelProgress, Profile } from "@/lib/types";
import { formatNumber } from "@/lib/format";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/tasks", label: "Missions", icon: "target" },
  { href: "/rewards", label: "Rewards", icon: "gift" },
  { href: "/leaderboard", label: "Ranks", icon: "trophy" },
  { href: "/notifications", label: "Alerts", icon: "bell" },
  { href: "/profile", label: "Profile", icon: "user" },
];

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function GameShell({
  profile,
  unread,
  progress,
  children,
}: {
  profile: Profile;
  unread: number;
  progress: LevelProgress;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh md:ps-64">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-[#2a2a2e] bg-[#0c0c0e] p-4 md:flex">
        <Link href="/" className="flex items-center gap-3 px-2 py-3">
          <BrandMark size="sm" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a1a1aa]">Daily missions</p>
            <p className="text-xl font-extrabold leading-6">Velora</p>
          </div>
        </Link>
        <div className="card mb-4 flex items-center gap-3 p-3">
          <Avatar name={profile.username} path={profile.avatar_url} />
          <div>
            <p className="font-extrabold">{profile.username}</p>
            <p className="text-sm text-[#a1a1aa]">Level {formatNumber(progress.level)}</p>
          </div>
        </div>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`nav-link ${active(pathname, link.href) ? "active" : ""}`}>
              <span>{link.label}</span>
              {link.href === "/notifications" && unread > 0 ? (
                <span className="rounded-full bg-rose-500 px-1.5 text-[11px] leading-5 text-white">{unread}</span>
              ) : null}
            </Link>
          ))}
          {profile.role === "admin" ? (
            <Link href="/admin" className="nav-link">
              <span>Admin</span>
            </Link>
          ) : null}
        </nav>
        <form action={logout} className="mt-auto">
          <button className="btn btn-ghost w-full">Sign out</button>
        </form>
      </aside>

      <div className="mx-auto w-full max-w-5xl px-4 py-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:py-8 md:pb-10">
        <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <div>
              <p className="text-xs text-[#a1a1aa]">Velora</p>
              <p className="font-extrabold">{profile.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span>Lv {formatNumber(progress.level)}</span>
            <span>{formatNumber(profile.coins)} coins</span>
          </div>
        </div>
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-[#2a2a2e] bg-[#09090b] px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={`relative grid place-items-center gap-1 rounded-md px-1 py-2 text-center text-[10px] font-semibold ${active(pathname, link.href) ? "text-[#fafafa]" : "text-[#a1a1aa]"}`}>
            <Icon name={link.icon} className="h-5 w-5" />
            {link.label}
            {link.href === "/notifications" && unread > 0 ? (
              <span className="absolute top-0 end-2 h-2 w-2 rounded-full bg-rose-400" />
            ) : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
