export default function SetupPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card max-w-xl p-6">
        <h1 className="text-3xl font-black">مهام مارو جيصه</h1>
        <p className="mt-3 leading-8 text-slate-200">
          الموقع لسه مش متصل بـ Supabase. حط المتغيرات دي في ملف <span className="font-bold">.env.local</span> وبعدين
          على Vercel، وشغّل ملف SQL الموجود في المشروع.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-cyan-100">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li>SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
      </div>
    </main>
  );
}
