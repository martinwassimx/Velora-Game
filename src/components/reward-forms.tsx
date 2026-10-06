"use client";

import { useActionState } from "react";
import { addRedeemReward, saveRewardVisibility } from "@/lib/actions/rewards";
import { Alert } from "@/components/ui";

export function RewardVisibilityForm({ comingSoon }: { comingSoon: boolean }) {
  const [state, action, pending] = useActionState(saveRewardVisibility, null);
  return (
    <form action={action} className="card space-y-3 p-4" key={comingSoon ? "soon" : "open"}>
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="ok">{state.ok}</Alert> : null}
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="rewards_coming_soon" defaultChecked={comingSoon} />
        Coming soon is on
      </label>
      <p className="text-sm leading-7 text-[#a1a1aa]">
        The box starts checked, so players see Coming soon and can't redeem. Uncheck it and save to show the rewards and what they can claim with coins.
      </p>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

export function AddRewardForm() {
  const [state, action, pending] = useActionState(addRedeemReward, null);
  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="font-extrabold">New reward</h2>
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="ok">{state.ok}</Alert> : null}
      <label className="block text-sm font-bold">
        Name
        <input className="field mt-1" name="title" required minLength={2} maxLength={80} placeholder="For example: a game voucher" />
      </label>
      <label className="block text-sm font-bold">
        Description
        <textarea className="field mt-1" name="description" maxLength={300} placeholder="Players will see these details" />
      </label>
      <label className="block text-sm font-bold">
        Coins required
        <input className="field mt-1 text-left" dir="ltr" type="number" name="coins" min={1} max={1000000} required defaultValue={100} />
      </label>
      <label className="block text-sm font-bold">
        Reward image
        <span className="mt-1 block text-xs font-normal text-[#a1a1aa]">Optional. JPG, PNG, or WEBP, under 5 MB</span>
        <input className="field mt-1" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Adding..." : "Add reward"}
      </button>
    </form>
  );
}
