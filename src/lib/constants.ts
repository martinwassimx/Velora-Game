export const DIFFICULTIES = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
  { id: "legendary", label: "Legendary" },
] as const;

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  legendary: "Legendary",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "In review",
  approved: "Approved",
  rejected: "Rejected",
  available: "Open",
  expired: "Expired",
  retry: "Try again",
  taken: "Claimed",
};

export const CONDITION_LABEL: Record<string, string> = {
  completed_tasks: "Completed missions",
  streak: "Longest streak",
  level: "Level",
  coins: "Total coins",
  xp: "Total XP",
};

export const FALLBACK_REWARDS: Record<string, { xp: number; coins: number }> = {
  easy: { xp: 25, coins: 10 },
  medium: { xp: 50, coins: 25 },
  hard: { xp: 100, coins: 50 },
  legendary: { xp: 200, coins: 100 },
};
