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
        قريبًا شغّال
      </label>
      <p className="text-sm leading-7 text-slate-300">
        الزرار متعلم من الأول، فاللاعب يشوف «قريبًا» ومقفول. لما تقفّل العلامة وتحفظ، المكافآت تظهر ويشوف يقدر ياخد إيه بالكوينز.
      </p>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "جاري الحفظ..." : "حفظ"}
      </button>
    </form>
  );
}

export function AddRewardForm() {
  const [state, action, pending] = useActionState(addRedeemReward, null);
  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="font-extrabold">مكافأة جديدة</h2>
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="ok">{state.ok}</Alert> : null}
      <label className="block text-sm font-bold">
        الاسم
        <input className="field mt-1" name="title" required minLength={2} maxLength={80} placeholder="مثال: قسيمة لعبة" />
      </label>
      <label className="block text-sm font-bold">
        الوصف
        <textarea className="field mt-1" name="description" maxLength={300} placeholder="اللاعب هيشوف التفاصيل دي" />
      </label>
      <label className="block text-sm font-bold">
        الكوينز المطلوبة
        <input className="field mt-1 text-left" dir="ltr" type="number" name="coins" min={1} max={1000000} required defaultValue={100} />
      </label>
      <label className="block text-sm font-bold">
        صورة المكافأة
        <span className="mt-1 block text-xs font-normal text-slate-400">اختيارية. JPG أو PNG أو WEBP، وأقل من 5 ميجا</span>
        <input className="field mt-1" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "جاري الإضافة..." : "أضف المكافأة"}
      </button>
    </form>
  );
}
