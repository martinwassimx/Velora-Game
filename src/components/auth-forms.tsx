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
      {pending ? "استنى شوية..." : label}
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
        الإيميل
        <input className="field mt-1" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm font-bold">
        الباسورد
        <input className="field mt-1" name="password" type="password" autoComplete="current-password" required />
      </label>
      <PendingButton label="دخول" />
      <div className="flex justify-between text-sm text-cyan-100">
        <Link href="/register">اعمل حساب جديد</Link>
        <Link href="/forgot-password">نسيت الباسورد؟</Link>
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
        اسم المستخدم
        <input className="field mt-1" name="username" minLength={3} maxLength={24} required />
      </label>
      <label className="block text-sm font-bold">
        الإيميل
        <input className="field mt-1" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm font-bold">
        الباسورد
        <input className="field mt-1" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label className="block text-sm font-bold">
        تأكيد الباسورد
        <input className="field mt-1" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <PendingButton label="إنشاء الحساب" />
      <p className="text-sm text-slate-300">
        عندك حساب؟ <Link href="/login" className="text-cyan-200">سجّل دخول</Link>
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
        الإيميل
        <input className="field mt-1" name="email" type="email" required />
      </label>
      <PendingButton label="ابعت رابط التغيير" />
      <Link href="/login" className="block text-sm text-cyan-200">رجوع لتسجيل الدخول</Link>
    </form>
  );
}

export function ResetForm() {
  const [state, action] = useActionState(updatePassword, null);
  return (
    <form action={action} className="space-y-3">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <label className="block text-sm font-bold">
        الباسورد الجديد
        <input className="field mt-1" name="password" type="password" minLength={8} required />
      </label>
      <label className="block text-sm font-bold">
        تأكيد الباسورد
        <input className="field mt-1" name="confirm" type="password" minLength={8} required />
      </label>
      <PendingButton label="حفظ الباسورد" />
    </form>
  );
}
