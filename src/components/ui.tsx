import { formatNumber, xpPercent } from "@/lib/format";
import { publicAvatar } from "@/lib/media";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-40 w-40" : size === "sm" ? "h-14 w-14" : "h-20 w-20";
  return (
    <img
      src="/maro.jpg"
      alt="مارو جيصه"
      className={`${sizeClass} rounded-full object-cover ring-2 ring-amber-300 shadow-[0_0_28px_rgba(232,163,23,0.45)]`}
    />
  );
}

export function Alert({ tone, children }: { tone: "ok" | "error" | "info"; children: React.ReactNode }) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-50"
      : tone === "error"
        ? "border-rose-300/30 bg-rose-400/10 text-rose-50"
        : "border-amber-300/30 bg-amber-400/10 text-amber-50";
  return <div className={`rounded-2xl border px-4 py-3 text-sm leading-7 ${toneClass}`}>{children}</div>;
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
        {eyebrow ? <p className="mb-1 text-sm font-bold text-amber-200">{eyebrow}</p> : null}
        <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-slate-300">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card px-5 py-10 text-center">
      <p className="text-lg font-extrabold">{title}</p>
      <p className="mt-2 text-slate-300">{body}</p>
    </div>
  );
}

export function Avatar({ name, path, size = "md" }: { name: string; path?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-24 w-24 text-3xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12";
  const url = publicAvatar(path);
  if (url) {
    return <img src={url} alt="" className={`${sizeClass} rounded-full object-cover ring-2 ring-amber-300/80`} />;
  }
  return (
    <div className={`${sizeClass} grid place-items-center rounded-full bg-gradient-to-br from-amber-200 to-yellow-600 font-black text-slate-950`}>
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
        <span className="font-extrabold text-amber-100">المستوى {formatNumber(level)}</span>
        <span className="text-slate-300">
          {formatNumber(xp)} / {formatNumber(nextXp)} XP
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-900/80" aria-hidden>
        <div className="h-full rounded-full bg-gradient-to-l from-yellow-200 via-amber-400 to-amber-700" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-sm text-slate-300">
        {icon} {label}
      </p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}
