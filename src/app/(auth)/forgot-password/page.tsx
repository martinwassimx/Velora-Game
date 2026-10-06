import { ForgotForm } from "@/components/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Forgot your password?</h2>
        <p className="text-[#a1a1aa]">We'll email you a reset link.</p>
      </div>
      <ForgotForm />
    </div>
  );
}
