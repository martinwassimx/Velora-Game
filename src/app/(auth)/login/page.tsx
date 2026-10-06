import { LoginForm } from "@/components/auth-forms";
import { Alert } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Welcome back</h2>
        <p className="text-[#a1a1aa]">Sign in and take today's mission.</p>
      </div>
      {params.error === "profile" ? <Alert tone="error">Your account is still being prepared. Try again in a moment.</Alert> : null}
      <LoginForm next={params.next} />
    </div>
  );
}
