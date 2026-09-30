import { ResetForm } from "@/components/auth-forms";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">باسورد جديد</h2>
        <p className="text-slate-300">اكتب الباسورد الجديد مرتين.</p>
      </div>
      <ResetForm />
    </div>
  );
}
