"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui";
import type { LevelProgress, Profile } from "@/lib/types";
import { formatNumber } from "@/lib/format";

const links = [
  { href: "/", label: "الرئيسية", icon: "🏠" },
  { href: "/tasks", label: "المهام", icon: "🎯" },
  { href: "/rewards", label: "المكافآت", icon: "🎁" },
  { href: "/leaderboard", label: "المتصدرين", icon: "🏆" },
  { href: "/notifications", label: "الإشعارات", icon: "🔔" },
  { href: "/profile", label: "حسابي", icon: "👤" },
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
    <div className="min-h-dvh md:ps-72">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-72 flex-col border-e border-white/10 bg-slate-950/80 p-4 backdrop-blur-xl md:flex">
        <Link href="/" className="px-2 py-3">
          <p className="text-xs font-bold text-cyan-200">لعبة المهام اليومية</p>
          <p className="text-2xl font-black">مهام مارو جيصه</p>
        </Link>
        <div className="card mb-4 flex items-center gap-3 p-3">
          <Avatar name={profile.username} path={profile.avatar_url} />
          <div>
            <p className="font-extrabold">{profile.username}</p>
            <p className="text-sm text-slate-300">المستوى {formatNumber(progress.level)}</p>
          </div>
        </div>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`nav-link ${active(pathname, link.href) ? "active" : ""}`}>
              <span>{link.icon}</span>
              <span>{link.label}</span>
              {link.href === "/notifications" && unread > 0 ? (
                <span className="ms-auto rounded-full bg-rose-400 px-2 text-xs font-black text-slate-950">{unread}</span>
              ) : null}
            </Link>
          ))}
          {profile.role === "admin" ? (
            <Link href="/admin" className="nav-link">
              <span>🛡️</span>
              <span>لوحة التحكم</span>
            </Link>
          ) : null}
        </nav>
        <form action={logout} className="mt-auto">
          <button className="btn btn-ghost w-full">خروج</button>
        </form>
      </aside>

      <div className="mx-auto w-full max-w-5xl px-4 py-4 pb-28 md:py-8 md:pb-10">
        <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
          <div>
            <p className="text-xs text-cyan-200">مهام مارو جيصه</p>
            <p className="font-extrabold">{profile.username}</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span>⭐ {formatNumber(progress.level)}</span>
            <span>🪙 {formatNumber(profile.coins)}</span>
            <span>🔥 {formatNumber(profile.current_streak)}</span>
          </div>
        </div>
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-white/10 bg-slate-950/95 px-1 py-2 backdrop-blur-xl md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={`relative grid place-items-center rounded-xl px-1 py-1 text-center text-[11px] font-bold ${active(pathname, link.href) ? "text-cyan-200" : "text-slate-400"}`}>
            <span className="text-lg">{link.icon}</span>
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
