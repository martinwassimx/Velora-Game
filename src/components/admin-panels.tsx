"use client";

import { useActionState, useState } from "react";
import {
  adjustCoins,
  adjustXp,
  banUser,
  reviewSubmission,
  saveAchievement,
  saveSettings,
  sendNotification,
  setUsername,
} from "@/lib/actions/admin";
import { CONDITION_LABEL, DIFFICULTIES } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { firstSubmitterCoins } from "@/lib/tasks";
import { Icon } from "@/components/icons";
import { Alert } from "@/components/ui";
import type { Achievement, PublicConfig } from "@/lib/types";

export function ReviewCard({
  id,
  username,
  task,
  note,
  imageUrl,
  createdAt,
  xp,
  coins,
  firstCoinBonus,
  firstSubmit = false,
}: {
  id: string;
  username: string;
  task: string;
  note: string | null;
  imageUrl: string | null;
  createdAt: string;
  xp: number;
  coins: number;
  firstCoinBonus: number;
  firstSubmit?: boolean;
}) {
  const [state, action, pending] = useActionState(reviewSubmission, null);
  const [rejecting, setRejecting] = useState(false);
  if (state?.ok) return <Alert tone="ok">{state.ok}</Alert>;

  return (
    <article className="card space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold">{task}</h2>
          <p className="text-sm text-[#a1a1aa]">
            {username} · {createdAt}
          </p>
          <p className="text-sm text-[#e4e4e7]">
            Reward: {formatNumber(xp)} XP and {formatNumber(firstSubmit ? firstSubmitterCoins(coins, firstCoinBonus) : coins)} coins
          </p>
          {firstSubmit && firstCoinBonus > 0 ? (
            <p className="text-sm font-bold text-[#e4e4e7]">First submission · they earn {formatNumber(firstCoinBonus)} extra coins</p>
          ) : null}
        </div>
      </div>
      {note ? <p className="rounded-2xl bg-[#18181b] p-3 text-sm leading-7">{note}</p> : null}
      {imageUrl ? <img src={imageUrl} alt="Mission photo" className="max-h-80 w-full rounded-2xl object-contain bg-black/30" /> : <p className="text-sm text-[#a1a1aa]">No photo</p>}
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {rejecting ? (
        <form action={action} className="space-y-2">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="reject" />
          <textarea className="field min-h-24" name="reason" placeholder="Rejection reason" required minLength={2} />
          <div className="flex gap-2">
            <button className="btn btn-danger" disabled={pending}>
              Confirm rejection
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setRejecting(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="approve" />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-bold">
              XP bonus
              <input className="field mt-1" name="bonus_xp" type="number" min={0} max={1000000} step={1} placeholder="0" />
            </label>
            <label className="text-sm font-bold">
              Coin bonus
              <input className="field mt-1" name="bonus_coins" type="number" min={0} max={1000000} step={1} placeholder="0" />
            </label>
          </div>
          <p className="text-sm text-[#a1a1aa]">If the answer is especially good, enter a bonus. Leave this blank if you don't want one.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ok" disabled={pending}>
              <Icon name="check" /> Approve
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setRejecting(true)}>
              <Icon name="x" /> Reject
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

export function UserEditor({ userId, username }: { userId: string; username: string }) {
  const [nameState, nameAction, namePending] = useActionState(setUsername, null);
  const [xpState, xpAction, xpPending] = useActionState(adjustXp, null);
  const [coinState, coinAction, coinPending] = useActionState(adjustCoins, null);
  const [banState, banAction, banPending] = useActionState(banUser, null);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form action={nameAction} className="card space-y-3 p-4">
        <h2 className="font-extrabold">Username</h2>
        {nameState?.error ? <Alert tone="error">{nameState.error}</Alert> : null}
        {nameState?.ok ? <Alert tone="ok">{nameState.ok}</Alert> : null}
        <input type="hidden" name="user_id" value={userId} />
        <input className="field" name="username" defaultValue={username} minLength={3} maxLength={24} />
        <button className="btn btn-primary" disabled={namePending}>Save name</button>
      </form>
      <form action={xpAction} className="card space-y-3 p-4">
        <h2 className="font-extrabold">XP</h2>
        {xpState?.error ? <Alert tone="error">{xpState.error}</Alert> : null}
        {xpState?.ok ? <Alert tone="ok">{xpState.ok}</Alert> : null}
        <input type="hidden" name="user_id" value={userId} />
        <input className="field" name="delta" type="number" placeholder="For example: 50 or -20" required />
        <button className="btn btn-primary" disabled={xpPending}>Apply</button>
      </form>
      <form action={coinAction} className="card space-y-3 p-4">
        <h2 className="font-extrabold">Coins</h2>
        {coinState?.error ? <Alert tone="error">{coinState.error}</Alert> : null}
        {coinState?.ok ? <Alert tone="ok">{coinState.ok}</Alert> : null}
        <input type="hidden" name="user_id" value={userId} />
        <input className="field" name="delta" type="number" placeholder="For example: 30 or -10" required />
        <button className="btn btn-primary" disabled={coinPending}>Apply</button>
      </form>
      <form action={banAction} className="card space-y-3 p-4">
        <h2 className="font-extrabold">Suspend account</h2>
        {banState?.error ? <Alert tone="error">{banState.error}</Alert> : null}
        {banState?.ok ? <Alert tone="ok">{banState.ok}</Alert> : null}
        <input type="hidden" name="user_id" value={userId} />
        <textarea className="field min-h-20" name="reason" placeholder="Suspension reason" required minLength={2} />
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="permanent" defaultChecked />
          Permanent suspension
        </label>
        <label className="block text-sm font-bold">
          Or an end time
          <input className="field mt-1" type="datetime-local" name="expires_at" />
        </label>
        <button className="btn btn-danger" disabled={banPending}>Suspend</button>
      </form>
    </div>
  );
}

export function NotifyForm({ users }: { users: { id: string; username: string }[] }) {
  const [state, action, pending] = useActionState(sendNotification, null);
  const [audience, setAudience] = useState("all");
  return (
    <form action={action} className="card space-y-3 p-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="ok">{state.ok}</Alert> : null}
      <label className="block text-sm font-bold">
        Who?
        <select className="field mt-1" name="audience" value={audience} onChange={(event) => setAudience(event.target.value)}>
          <option value="all">All players</option>
          <option value="user">A specific player</option>
        </select>
      </label>
      {audience === "user" ? (
        <label className="block text-sm font-bold">
          Player
          <select className="field mt-1" name="user_id" required>
            <option value="">Choose</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block text-sm font-bold">
        Title
        <input className="field mt-1" name="title" required maxLength={120} />
      </label>
      <label className="block text-sm font-bold">
        Message
        <textarea className="field mt-1 min-h-24" name="body" required maxLength={500} />
      </label>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

export function AchievementForm({ achievement }: { achievement?: Achievement | null }) {
  const [state, action, pending] = useActionState(saveAchievement, null);
  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="font-extrabold">{achievement ? "Edit achievement" : "New achievement"}</h2>
      {achievement ? <input type="hidden" name="id" value={achievement.id} /> : null}
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-bold">Code<input className="field mt-1" name="slug" defaultValue={achievement?.slug ?? ""} required /></label>
        <label className="text-sm font-bold">
          Icon
          <select className="field mt-1" name="icon" defaultValue={achievement?.icon ?? "trophy"}>
            <option value="trophy">Trophy</option>
            <option value="flame">Flame</option>
            <option value="zap">XP</option>
            <option value="gem">Gem</option>
            <option value="crown">Crown</option>
            <option value="coin">Coin</option>
            <option value="star">Star</option>
            <option value="award">Award</option>
          </select>
        </label>
        <label className="text-sm font-bold md:col-span-2">Title<input className="field mt-1" name="title" defaultValue={achievement?.title ?? ""} required /></label>
        <label className="text-sm font-bold md:col-span-2">Description<textarea className="field mt-1" name="description" defaultValue={achievement?.description ?? ""} required /></label>
        <label className="text-sm font-bold">
          Requirement
          <select className="field mt-1" name="condition_type" defaultValue={achievement?.condition_type ?? "completed_tasks"}>
            {Object.entries(CONDITION_LABEL).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">Value<input className="field mt-1" type="number" min={1} name="condition_value" defaultValue={achievement?.condition_value ?? 1} required /></label>
      </div>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="is_active" defaultChecked={achievement?.is_active ?? true} />
        Visible to players
      </label>
      <button className="btn btn-primary" disabled={pending}>Save achievement</button>
    </form>
  );
}

export function SettingsForm({ config }: { config: PublicConfig }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  const rewards = new Map(config.daily_rewards.map((item) => [item.day, item.coins]));
  return (
    <form action={action} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="ok">{state.ok}</Alert> : null}
      <section className="card space-y-3 p-4">
        <h2 className="font-extrabold">Game rules</h2>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="leaderboard_enabled" defaultChecked={config.leaderboard_enabled} />
          Leaderboard is visible
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="streak_reset_on_miss" defaultChecked={config.streak_reset_on_miss} />
          If a day is missed, the streak starts over
        </label>
        <label className="block text-sm font-bold">
          Time zone
          <input className="field mt-1 text-left" dir="ltr" name="timezone" defaultValue={config.timezone} />
        </label>
        <label className="block text-sm font-bold">
          XP levels, separated by commas. The first number must be 0
          <input className="field mt-1 text-left" dir="ltr" name="level_thresholds" defaultValue={config.level_thresholds.join(", ")} />
        </label>
      </section>
      <section className="card space-y-3 p-4">
        <h2 className="font-extrabold">Daily login reward</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <label key={day} className="text-sm font-bold">
              Day {day}
              <input className="field mt-1 text-left" dir="ltr" type="number" min={0} name={`reward_${day}`} defaultValue={rewards.get(day) ?? 0} />
            </label>
          ))}
        </div>
      </section>
      <section className="card space-y-3 p-4">
        <h2 className="font-extrabold">Default reward for each difficulty</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {DIFFICULTIES.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#2a2a2e] p-3">
              <p className="mb-2 font-extrabold">{item.label}</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm">XP<input className="field mt-1 text-left" dir="ltr" type="number" min={0} name={`${item.id}_xp`} defaultValue={config.difficulty_defaults[item.id]?.xp ?? 0} /></label>
                <label className="text-sm">Coins<input className="field mt-1 text-left" dir="ltr" type="number" min={0} name={`${item.id}_coins`} defaultValue={config.difficulty_defaults[item.id]?.coins ?? 0} /></label>
              </div>
            </div>
          ))}
        </div>
      </section>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving..." : "Save settings"}</button>
    </form>
  );
}
