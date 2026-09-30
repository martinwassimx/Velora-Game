export type Role = "user" | "admin";

export type Profile = {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  coins: number;
  current_streak: number;
  longest_streak: number;
  last_streak_date: string | null;
  total_completed_tasks: number;
  total_submitted_tasks: number;
  total_xp_earned: number;
  total_coins_earned: number;
  role: Role;
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

export type LevelProgress = {
  level: number;
  floor_xp: number;
  next_xp: number;
  xp: number;
};

export type DailyRewardConfig = { day: number; coins: number };

export type PublicConfig = {
  leaderboard_enabled: boolean;
  streak_reset_on_miss: boolean;
  timezone: string;
  level_thresholds: number[];
  daily_rewards: DailyRewardConfig[];
  difficulty_defaults: Record<string, { xp: number; coins: number }>;
};

export type DailyClaim = {
  already: boolean;
  coins: number;
  streak: number;
  day: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  difficulty: "easy" | "medium" | "hard" | "legendary";
  xp_reward: number;
  coin_reward: number;
  deadline: string | null;
  requires_photo: boolean;
  max_submissions: number;
  allow_resubmission: boolean;
  is_active: boolean;
  assign_to: "everyone" | "specific";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Submission = {
  id: string;
  user_id: string;
  task_id: string;
  photo_url: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reward_granted: boolean;
  created_at: string;
};

export type Achievement = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  condition_type: "completed_tasks" | "streak" | "level" | "coins" | "xp";
  condition_value: number;
  is_active: boolean;
};

export type NotificationItem = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export type Ban = {
  id: string;
  user_id: string;
  reason: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type LeaderRow = {
  place: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  coins: number;
  current_streak: number;
  total_completed_tasks: number;
  is_me: boolean;
};

export type DashboardStats = {
  total_users: number;
  active_users: number;
  banned_users: number;
  tasks_today: number;
  pending_submissions: number;
  completed_tasks: number;
  total_xp: number;
  total_coins: number;
  signups: { date: string; count: number }[];
  submissions: { date: string; pending: number; approved: number; rejected: number }[];
};

export type ActionState = {
  error?: string;
  ok?: string;
} | null;

export type AdminLog = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  description: string;
  created_at: string;
  admin?: { username: string } | null;
};
