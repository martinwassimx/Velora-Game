export const DIFFICULTIES = [
  { id: "easy", label: "سهل" },
  { id: "medium", label: "متوسط" },
  { id: "hard", label: "صعب" },
  { id: "legendary", label: "أسطوري" },
] as const;

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
  legendary: "أسطوري",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "مستنية المراجعة",
  approved: "اتقبلت",
  rejected: "اترفضت",
  available: "متاحة",
  expired: "الميعاد خلّص",
  retry: "تقدر تبعتها تاني",
  taken: "اتاخدت",
};

export const CONDITION_LABEL: Record<string, string> = {
  completed_tasks: "عدد المهام المكتملة",
  streak: "أطول ستريك",
  level: "المستوى",
  coins: "إجمالي الكوينز",
  xp: "إجمالي الـ XP",
};

export const FALLBACK_REWARDS: Record<string, { xp: number; coins: number }> = {
  easy: { xp: 25, coins: 10 },
  medium: { xp: 50, coins: 25 },
  hard: { xp: 100, coins: 50 },
  legendary: { xp: 200, coins: 100 },
};
