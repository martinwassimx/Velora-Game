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
        <h2 className="text-2xl font-black">أهلاً بيك 👋</h2>
        <p className="text-slate-300">سجّل دخول وكمل مهمة النهارده.</p>
      </div>
      {params.error === "profile" ? <Alert tone="error">حسابك لسه بيتجهز. جرّب تاني بعد ثانية.</Alert> : null}
      <LoginForm next={params.next} />
    </div>
  );
}
