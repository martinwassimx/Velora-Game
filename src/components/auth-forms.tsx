"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { forgotPassword, login, register, updatePassword } from "@/lib/actions/auth";
import { Alert } from "@/components/ui";

function PendingButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary w-full" disabled={pending}>
      {pending ? "Please wait..." : label}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next ?? "/"} />
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <label className="block text-sm font-bold">
        Email
        <input className="field mt-1" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm font-bold">
        Password
        <input className="field mt-1" name="password" type="password" autoComplete="current-password" required />
      </label>
      <PendingButton label="Sign in" />
      <div className="flex justify-between text-sm text-[#d4d4d8]">
        <Link href="/register">Create an account</Link>
        <Link href="/forgot-password">Forgot password?</Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(register, null);
  return (
    <form action={action} className="space-y-3">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="ok">{state.ok}</Alert> : null}
      <label className="block text-sm font-bold">
        Username
        <input className="field mt-1" name="username" minLength={3} maxLength={24} required />
      </label>
      <label className="block text-sm font-bold">
        Email
        <input className="field mt-1" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm font-bold">
        Password
        <input className="field mt-1" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label className="block text-sm font-bold">
        Confirm password
        <input className="field mt-1" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <PendingButton label="Create account" />
      <p className="text-sm text-[#a1a1aa]">
        Already have an account? <Link href="/login" className="text-[#e4e4e7]">Sign in</Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(forgotPassword, null);
  return (
    <form action={action} className="space-y-3">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="ok">{state.ok}</Alert> : null}
      <label className="block text-sm font-bold">
        Email
        <input className="field mt-1" name="email" type="email" required />
      </label>
      <PendingButton label="Send reset link" />
      <Link href="/login" className="block text-sm text-[#e4e4e7]">Back to sign in</Link>
    </form>
  );
}

export function ResetForm() {
  const [state, action] = useActionState(updatePassword, null);
  return (
    <form action={action} className="space-y-3">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <label className="block text-sm font-bold">
        New password
        <input className="field mt-1" name="password" type="password" minLength={8} required />
      </label>
      <label className="block text-sm font-bold">
        Confirm password
        <input className="field mt-1" name="confirm" type="password" minLength={8} required />
      </label>
      <PendingButton label="Save password" />
    </form>
  );
}
