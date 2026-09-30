"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

const links = [
  { href: "/admin", label: "لوحة التحكم" },
  { href: "/admin/users", label: "المستخدمين" },
  { href: "/admin/tasks", label: "المهام" },
  { href: "/admin/submissions", label: "طلبات المراجعة" },
  { href: "/admin/notifications", label: "الإشعارات" },
  { href: "/admin/achievements", label: "الإنجازات" },
  { href: "/admin/rewards", label: "المكافآت" },
  { href: "/admin/settings", label: "الإعدادات" },
  { href: "/admin/logs", label: "سجل العمليات" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh md:ps-72">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-72 flex-col border-e border-white/10 bg-slate-950/85 p-4 md:flex">
        <div className="px-2 py-3">
          <p className="text-xs font-bold text-amber-200">أدمن</p>
          <p className="text-2xl font-black">لوحة التحكم</p>
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
            رجوع للّعبة
          </Link>
          <form action={logout}>
            <button className="btn btn-ghost w-full">خروج</button>
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
            اللعبة
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
