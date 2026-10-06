"use client";

import { useActionState, useState } from "react";
import { submitTask, updateProfile } from "@/lib/actions/player";
import { updatePassword } from "@/lib/actions/auth";
import { Alert } from "@/components/ui";

export function TaskSubmitForm({ taskId, requiresPhoto }: { taskId: string; requiresPhoto: boolean }) {
  const [state, action, pending] = useActionState(submitTask, null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form action={action} className="card space-y-3 p-4">
      <input type="hidden" name="task_id" value={taskId} />
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="ok">{state.ok}</Alert> : null}
      <label className="block text-sm font-bold">
        Optional note
        <textarea className="field mt-1 min-h-24" name="note" maxLength={500} placeholder="Say what you did, in a sentence or two" />
      </label>
      <label className="block text-sm font-bold">
        {requiresPhoto ? "Upload the mission photo" : "Optional photo"}
        <span className="mt-1 block text-xs font-normal text-[#a1a1aa]">JPG, PNG, or WEBP, under 5 MB</span>
        <input
          className="field mt-1"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={requiresPhoto}
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
      </label>
      {preview ? <img src={preview} alt="Photo preview" className="max-h-64 w-full rounded-2xl object-cover" /> : null}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Sending..." : "Mission done"}
      </button>
    </form>
  );
}

export function ProfileForm({ username }: { username: string }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="text-lg font-extrabold">Edit profile</h2>
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="ok">{state.ok}</Alert> : null}
      <label className="block text-sm font-bold">
        Username
        <input className="field mt-1" name="username" defaultValue={username} minLength={3} maxLength={24} required />
      </label>
      <label className="block text-sm font-bold">
        Profile photo
        <input className="field mt-1" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, null);
  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="text-lg font-extrabold">Change password</h2>
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <label className="block text-sm font-bold">
        New password
        <input className="field mt-1" name="password" type="password" minLength={8} required />
      </label>
      <label className="block text-sm font-bold">
        Confirm password
        <input className="field mt-1" name="confirm" type="password" minLength={8} required />
      </label>
      <button className="btn btn-ghost" disabled={pending}>
        {pending ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
