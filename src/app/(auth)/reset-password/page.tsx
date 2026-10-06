import { ResetForm } from "@/components/auth-forms";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">New password</h2>
        <p className="text-[#a1a1aa]">Enter the new password twice.</p>
      </div>
      <ResetForm />
    </div>
  );
}
