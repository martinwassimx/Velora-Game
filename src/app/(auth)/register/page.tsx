import { RegisterForm } from "@/components/auth-forms";

export default function RegisterPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">اعمل حسابك</h2>
        <p className="text-slate-300">اسم، إيميل، وباسورد. وبعدين ابدأ اللعب.</p>
      </div>
      <RegisterForm />
    </div>
  );
}
