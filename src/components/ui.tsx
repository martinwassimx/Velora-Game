import type { ReactNode } from "react";
import { formatNumber, xpPercent } from "@/lib/format";
import { publicAvatar } from "@/lib/media";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-28 w-28" : size === "sm" ? "h-11 w-11" : "h-16 w-16";
  return (
    <img
      src="/brand.png"
      alt="Velora"
      className={`${sizeClass} rounded-md object-cover`}
    />
  );
}

export function Alert({ tone, children }: { tone: "ok" | "error" | "info"; children: React.ReactNode }) {
  const toneClass =
    tone === "ok"
      ? "border-[#2a2a2e] bg-[#1c1c1f] text-[#d4d4d8]"
      : tone === "error"
        ? "border-[#5c2424] bg-[#2a1515] text-[#fecaca]"
        : "border-[#2a2a2e] bg-[#111113] text-[#d4d4d8]";
  return <div className={`rounded-md border px-4 py-3 text-sm leading-7 ${toneClass}`}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="mb-1 text-sm font-bold text-[#e4e4e7]">{eyebrow}</p> : null}
        <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-[#a1a1aa]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card px-5 py-10 text-center">
      <p className="text-lg font-extrabold">{title}</p>
      <p className="mt-2 text-[#a1a1aa]">{body}</p>
    </div>
  );
}

export function Avatar({ name, path, size = "md" }: { name: string; path?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-24 w-24 text-3xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12";
  const url = publicAvatar(path);
  if (url) {
    return <img src={url} alt="" className={`${sizeClass} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sizeClass} grid place-items-center rounded-full bg-[#27272a] font-bold text-[#fafafa]`}>
      {name.slice(0, 1)}
    </div>
  );
}

export function XpBar({
  level,
  xp,
  floorXp,
  nextXp,
}: {
  level: number;
  xp: number;
  floorXp: number;
  nextXp: number;
}) {
  const width = xpPercent(xp, floorXp, nextXp);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-bold">Level {formatNumber(level)}</span>
        <span className="text-[#a1a1aa]">
          {formatNumber(xp)} / {formatNumber(nextXp)} XP
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#27272a]" aria-hidden>
        <div className="h-full rounded-full bg-[#fafafa]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function Stat({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="card px-4 py-3">
      <p className="flex items-center gap-2 text-sm text-[#a1a1aa]">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
