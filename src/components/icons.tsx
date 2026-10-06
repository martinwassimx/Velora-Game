import type { ReactNode } from "react";

export type IconName =
  | "home"
  | "target"
  | "gift"
  | "trophy"
  | "bell"
  | "user"
  | "shield"
  | "logout"
  | "zap"
  | "coin"
  | "flame"
  | "check"
  | "x"
  | "star"
  | "users"
  | "ban"
  | "upload"
  | "flag"
  | "award"
  | "lock"
  | "camera"
  | "activity"
  | "gem"
  | "crown";

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.5V20h11V9.5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="1.5" />
      <path d="M4 14h16M12 10v10" />
      <path d="M12 10c-2 0-3.5-1.2-3.5-2.7S10 4.5 12 6.5c2-2 3.5-1.4 3.5.8S14 10 12 10Z" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5.5A2.5 2.5 0 0 0 8 10M16 6h2.5A2.5 2.5 0 0 1 16 10M12 13v3M9 20h6M10 17h4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2h-15L6 16Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.5c1.2-3 3.5-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
    </>
  ),
  shield: (
    <path d="M12 3.5 19 6.5v5.2c0 4.2-2.8 7.2-7 8.8-4.2-1.6-7-4.6-7-8.8V6.5L12 3.5Z" />
  ),
  logout: (
    <>
      <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" />
      <path d="M13 8.5 17.5 12 13 15.5M17 12H9" />
    </>
  ),
  zap: <path d="M13 3 6 13h5l-1 8 8-11h-5l0-7Z" />,
  coin: (
    <>
      <ellipse cx="12" cy="12" rx="8" ry="8" />
      <path d="M12 8v8M9.5 10.2c.6-.8 1.5-1.2 2.5-1.2 1.6 0 2.5.8 2.5 1.8S13.4 12.5 12 12.5s-2.6.7-2.6 1.8 1.2 1.8 2.6 1.8c1 0 1.9-.4 2.5-1.1" />
    </>
  ),
  flame: <path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-2 1.2-3.4 2.2-4.4C10 9 11 10 11 12c1.2-1.4 1.6-3.2 1-5.2C12.4 5.2 12 4 12 3Z" />,
  check: <path d="M5 12.5 9.5 17 19 7" />,
  x: <path d="M7 7l10 10M17 7 7 17" />,
  star: <path d="m12 3.5 2.4 5 5.5.7-4 3.9.9 5.4L12 16.2 7.2 18.5l.9-5.4-4-3.9 5.5-.7L12 3.5Z" />,
  users: (
    <>
      <circle cx="9" cy="9" r="2.6" />
      <path d="M4.5 18.5c.8-2.4 2.4-3.6 4.5-3.6s3.7 1.2 4.5 3.6" />
      <circle cx="16" cy="9.5" r="2.2" />
      <path d="M15.2 14.9c1.6.2 2.8 1.1 3.5 2.8" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="m7 7 10 10" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V6M8 9.5 12 5.5 16 9.5" />
      <path d="M5 19h14" />
    </>
  ),
  flag: (
    <>
      <path d="M6 20V4" />
      <path d="M6 5h10l-1.5 3L16 11H6" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="m9 13.5-1.5 6L12 17l4.5 2.5L15 13.5" />
    </>
  ),
  lock: (
    <>
      <rect x="6" y="10" width="12" height="9" rx="1.5" />
      <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5h3l1.5-2h7L17 8.5h3V19H4V8.5Z" />
      <circle cx="12" cy="13.5" r="3" />
    </>
  ),
  activity: <path d="M3 12h4l2.5-6 4 12L16 12h5" />,
  gem: <path d="M4 9 8 4h8l4 5-8 11L4 9Zm0 0h16M8 4l4 5 4-5M12 9v11" />,
  crown: <path d="M4 16 6.5 7 12 12l5.5-5L20 16H4Z" />,
};

const emojiToIcon: Record<string, IconName> = {
  "🏆": "trophy",
  "🔥": "flame",
  "⚡": "zap",
  "💎": "gem",
  "👑": "crown",
  "🪙": "coin",
  "🌟": "star",
  "⭐": "star",
  "🎯": "target",
  "🎁": "gift",
};

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden>
      {paths[name]}
    </svg>
  );
}

export function Mark({ value, className = "h-4 w-4" }: { value: string; className?: string }) {
  const named = (emojiToIcon[value] ?? (value in paths ? value : "award")) as IconName;
  return <Icon name={named} className={className} />;
}
