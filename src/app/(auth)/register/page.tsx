import { RegisterForm } from "@/components/auth-forms";

export default function RegisterPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Create your account</h2>
        <p className="text-[#a1a1aa]">A username, email, and password. Then start playing.</p>
      </div>
      <RegisterForm />
    </div>
  );
}
