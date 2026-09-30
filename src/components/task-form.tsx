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
}: {
  task?: Task | null;
  users: { id: string; username: string }[];
  assignedIds: string[];
  defaults: Record<string, { xp: number; coins: number }>;
  deadlineValue: string;
  firstOnly?: boolean;
}) {
  const [state, action, pending] = useActionState(saveTask, null);
  const initialDifficulty = task?.difficulty ?? "medium";
  const reward = defaults[initialDifficulty] ?? FALLBACK_REWARDS[initialDifficulty];
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [xp, setXp] = useState(task?.xp_reward ?? reward.xp);
  const [coins, setCoins] = useState(task?.coin_reward ?? reward.coins);
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
        عنوان المهمة
        <input className="field mt-1" name="title" defaultValue={task?.title ?? ""} required minLength={2} maxLength={120} />
      </label>
      <label className="block text-sm font-bold">
        الوصف
        <textarea className="field mt-1 min-h-24" name="description" defaultValue={task?.description ?? ""} />
      </label>
      <label className="block text-sm font-bold">
        التعليمات
        <textarea className="field mt-1 min-h-24" name="instructions" defaultValue={task?.instructions ?? ""} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-bold">
          الصعوبة
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
          آخر ميعاد
          <input className="field mt-1" type="datetime-local" name="deadline" defaultValue={deadlineValue} />
        </label>
        <label className="text-sm font-bold">
          مكافأة XP
          <input className="field mt-1" type="number" min={0} name="xp_reward" value={xp} onChange={(event) => setXp(Number(event.target.value))} />
        </label>
        <label className="text-sm font-bold">
          مكافأة الكوينز
          <input className="field mt-1" type="number" min={0} name="coin_reward" value={coins} onChange={(event) => setCoins(Number(event.target.value))} />
        </label>
        <label className="text-sm font-bold">
          أقصى عدد إكمال
          <input className="field mt-1" type="number" min={1} max={100} name="max_submissions" defaultValue={task?.max_submissions ?? 1} />
        </label>
        <label className="text-sm font-bold">
          التعيين
          <select className="field mt-1" name="assign_to" value={assignTo} onChange={(event) => setAssignTo(event.target.value as "everyone" | "specific")}>
            <option value="everyone">كل اللاعبين</option>
            <option value="specific">لاعبين محددين</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm font-bold">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="requires_photo" defaultChecked={task?.requires_photo ?? false} />
          مطلوب صورة
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allow_resubmission" defaultChecked={task?.allow_resubmission ?? false} />
          السماح بإعادة الإرسال بعد الرفض
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={task?.is_active ?? true} />
          المهمة شغالة
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="first_only" defaultChecked={firstOnly} />
          لأول واحد بس
        </label>
      </div>
      {assignTo === "specific" ? (
        <div className="rounded-2xl border border-white/10 p-3">
          <input className="field mb-3" placeholder="دوّر على لاعب" value={query} onChange={(event) => setQuery(event.target.value)} />
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
        {pending ? "جاري الحفظ..." : task ? "حفظ التعديل" : "إنشاء المهمة"}
      </button>
    </form>
  );
}
