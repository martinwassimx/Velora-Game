import { ForgotForm } from "@/components/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">نسيت الباسورد؟</h2>
        <p className="text-slate-300">هنبعتلك رابط تغيير على الإيميل.</p>
      </div>
      <ForgotForm />
    </div>
  );
}
