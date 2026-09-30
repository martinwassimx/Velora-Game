import type { Task } from "@/lib/types";

export function firstSubmitterCoins(coins: number) {
  return Math.min(coins * 2, 1000000);
}

export function describeTask(
  task: Pick<Task, "id" | "deadline" | "is_active" | "max_submissions" | "allow_resubmission">,
  submissions: { task_id: string; status: string }[],
  claimedBySomeoneElse = false,
) {
  const mine = submissions.filter((item) => item.task_id === task.id);
  const approved = mine.filter((item) => item.status === "approved").length;
  const pending = mine.some((item) => item.status === "pending");
  const rejected = mine.some((item) => item.status === "rejected");
  const expired = Boolean(task.deadline && new Date(task.deadline).getTime() < Date.now());

  let state: "available" | "pending" | "approved" | "rejected" | "expired" | "retry" | "inactive" | "taken" = "available";
  if (!task.is_active) state = "inactive";
  else if (approved >= task.max_submissions) state = "approved";
  else if (pending) state = "pending";
  else if (expired) state = "expired";
  else if (claimedBySomeoneElse) state = "taken";
  else if (rejected && !task.allow_resubmission) state = "rejected";
  else if (rejected && task.allow_resubmission) state = "retry";

  return {
    state,
    canSubmit: task.is_active && !expired && (state === "available" || state === "retry"),
    approved,
  };
}
