"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { BrandMark } from "@/components/ui";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/tasks", label: "Missions" },
  { href: "/admin/submissions", label: "Review queue" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/achievements", label: "Achievements" },
  { href: "/admin/rewards", label: "Rewards" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/logs", label: "Activity log" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh md:ps-64">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-[#2a2a2e] bg-[#0c0c0e] p-4 md:flex">
        <div className="flex items-center gap-3 px-2 py-3">
          <BrandMark size="sm" />
          <div>
            <p className="text-xs font-bold text-[#e4e4e7]">Admin</p>
            <p className="text-xl font-black leading-6">Dashboard</p>
          </div>
        </div>
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = link.href === "/admin" ? pathname === "/admin" : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} className={`nav-link ${isActive ? "active" : ""}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2">
          <Link href="/" className="btn btn-ghost w-full">
            Back to the game
          </Link>
          <form action={logout}>
            <button className="btn btn-ghost w-full">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="mx-auto w-full max-w-6xl px-4 py-4 pb-8 md:py-8">
        <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="chip shrink-0">
              {link.label}
            </Link>
          ))}
          <Link href="/" className="chip shrink-0">
            Game
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
