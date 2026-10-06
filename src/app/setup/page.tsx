import { BrandMark } from "@/components/ui";

export default function SetupPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card max-w-xl p-6">
        <div className="mb-4 flex justify-center">
          <BrandMark size="lg" />
        </div>
        <h1 className="text-center text-3xl font-black">Velora</h1>
        <p className="mt-3 leading-8 text-[#d4d4d8]">
          This site isn't connected to Supabase yet. Add these variables to <span className="font-bold">.env.local</span>, then
          add them on Vercel, and run the SQL file in the project.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-[#d4d4d8]">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li>SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
      </div>
    </main>
  );
}
