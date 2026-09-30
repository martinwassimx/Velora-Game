"use client";

import { useState } from "react";
import { dismissNotice } from "@/lib/actions/player";

function Confetti() {
  const colors = ["#67e8f9", "#fde68a", "#c4b5fd", "#fb7185", "#6ee7b7"];
  return (
    <div className="confetti pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 28 }, (_, index) => (
        <span
          key={index}
          style={{
            right: `${(index * 37) % 100}%`,
            background: colors[index % colors.length],
            animationDelay: `${(index % 8) * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

export function GameEffects({
  reward,
  levelUp,
}: {
  reward: { id: string; body: string } | null;
  levelUp: { id: string; body: string } | null;
}) {
  const [showReward, setShowReward] = useState(Boolean(reward));
  const [showLevel, setShowLevel] = useState(Boolean(levelUp));
  if (!showReward && !showLevel) return null;

  return (
    <>
      {showLevel && levelUp ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4">
          <Confetti />
          <div className="popup card relative z-10 w-full max-w-md px-6 py-8 text-center">
            <p className="text-4xl">🎉</p>
            <h2 className="mt-3 text-3xl font-black">LEVEL UP!</h2>
            <p className="mt-2 text-xl text-amber-200">{levelUp.body}</p>
            <form action={dismissNotice} className="mt-6" onSubmit={() => setShowLevel(false)}>
              <input type="hidden" name="id" value={levelUp.id} />
              <button className="btn btn-primary w-full">يلا نكمل 🔥</button>
            </form>
          </div>
        </div>
      ) : null}
      {showReward && reward && !showLevel ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4">
          <div className="popup card w-full max-w-md px-6 py-8 text-center">
            <p className="text-4xl">🎁</p>
            <h2 className="mt-3 text-2xl font-black">مكافأة الدخول اليومية</h2>
            <p className="mt-3 text-lg leading-8 text-amber-100">{reward.body}</p>
            <form action={dismissNotice} className="mt-6" onSubmit={() => setShowReward(false)}>
              <input type="hidden" name="id" value={reward.id} />
              <button className="btn btn-primary w-full">تمام، شكراً</button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
