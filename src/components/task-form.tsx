"use client";

import { useActionState, useMemo, useState } from "react";
import { saveTask } from "@/lib/actions/admin";
import { DIFFICULTIES, FALLBACK_REWARDS } from "@/lib/constants";
import { Alert } from "@/components/ui";
import type { Task } from "@/lib/types";

export function TaskForm({
  task,
  users,
  assignedIds,
  defaults,
  deadlineValue,
  firstOnly = false,
  firstCoinBonus,
}: {
  task?: Task | null;
  users: { id: string; username: string }[];
  assignedIds: string[];
  defaults: Record<string, { xp: number; coins: number }>;
  deadlineValue: string;
  firstOnly?: boolean;
  firstCoinBonus?: number;
}) {
  const [state, action, pending] = useActionState(saveTask, null);
  const initialDifficulty = task?.difficulty ?? "medium";
  const reward = defaults[initialDifficulty] ?? FALLBACK_REWARDS[initialDifficulty];
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [xp, setXp] = useState(task?.xp_reward ?? reward.xp);
  const [coins, setCoins] = useState(task?.coin_reward ?? reward.coins);
  const [firstBonus, setFirstBonus] = useState(firstCoinBonus ?? reward.coins);
  const [bonusFollowsCoins, setBonusFollowsCoins] = useState(firstCoinBonus === undefined);
  const [assignTo, setAssignTo] = useState(task?.assign_to ?? "everyone");
  const [query, setQuery] = useState("");
  const visibleUsers = useMemo(
    () => users.filter((user) => user.username.toLowerCase().includes(query.trim().toLowerCase())),
    [query, users],
  );

  return (
    <form action={action} className="card space-y-4 p-4 md:p-6">
      {task ? <input type="hidden" name="id" value={task.id} /> : null}
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <label className="block text-sm font-bold">
        Mission title
        <input className="field mt-1" name="title" defaultValue={task?.title ?? ""} required minLength={2} maxLength={120} />
      </label>
      <label className="block text-sm font-bold">
        Description
        <textarea className="field mt-1 min-h-24" name="description" defaultValue={task?.description ?? ""} />
      </label>
      <label className="block text-sm font-bold">
        Instructions
        <textarea className="field mt-1 min-h-24" name="instructions" defaultValue={task?.instructions ?? ""} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-bold">
          Difficulty
          <select
            className="field mt-1"
            name="difficulty"
            value={difficulty}
            onChange={(event) => {
              const value = event.target.value;
              setDifficulty(value as Task["difficulty"]);
              const next = defaults[value] ?? FALLBACK_REWARDS[value];
              if (next) {
                setXp(next.xp);
                setCoins(next.coins);
                if (bonusFollowsCoins) setFirstBonus(next.coins);
              }
            }}
          >
            {DIFFICULTIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Deadline
          <input className="field mt-1" type="datetime-local" name="deadline" defaultValue={deadlineValue} />
        </label>
        <label className="text-sm font-bold">
          XP reward
          <input className="field mt-1" type="number" min={0} name="xp_reward" value={xp} onChange={(event) => setXp(Number(event.target.value))} />
        </label>
        <label className="text-sm font-bold">
          Coin reward
          <input className="field mt-1" type="number" min={0} name="coin_reward" value={coins} onChange={(event) => {
            const next = Number(event.target.value);
            setCoins(next);
            if (bonusFollowsCoins) setFirstBonus(next);
          }} />
        </label>
        <label className="text-sm font-bold">
          First-player coin bonus
          <input
            className="field mt-1"
            type="number"
            min={0}
            max={1000000}
            name="first_coin_bonus"
            value={firstBonus}
            onChange={(event) => {
              setBonusFollowsCoins(false);
              setFirstBonus(Number(event.target.value));
            }}
          />
          <span className="mt-1 block font-normal text-[#a1a1aa]">
            {firstBonus > 0
              ? `The first player earns ${coins + firstBonus} coins. Everyone else earns ${coins}.`
              : "The first player earns the same number of coins."}
          </span>
        </label>
        <label className="text-sm font-bold">
          Maximum completions
          <input className="field mt-1" type="number" min={1} max={100} name="max_submissions" defaultValue={task?.max_submissions ?? 1} />
        </label>
        <label className="text-sm font-bold">
          Assignment
          <select className="field mt-1" name="assign_to" value={assignTo} onChange={(event) => setAssignTo(event.target.value as "everyone" | "specific")}>
            <option value="everyone">All players</option>
            <option value="specific">Specific players</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm font-bold">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="requires_photo" defaultChecked={task?.requires_photo ?? false} />
          Photo required
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allow_resubmission" defaultChecked={task?.allow_resubmission ?? false} />
          Allow resubmission after rejection
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={task?.is_active ?? true} />
          Mission is active
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="first_only" defaultChecked={firstOnly} />
          First player only
        </label>
      </div>
      {assignTo === "specific" ? (
        <div className="rounded-2xl border border-[#2a2a2e] p-3">
          <input className="field mb-3" placeholder="Search for a player" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">
            {visibleUsers.map((user) => (
              <label key={user.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="assignees" value={user.id} defaultChecked={assignedIds.includes(user.id)} />
                {user.username}
              </label>
            ))}
          </div>
        </div>
      ) : null}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Saving..." : task ? "Save changes" : "Create mission"}
      </button>
    </form>
  );
}
