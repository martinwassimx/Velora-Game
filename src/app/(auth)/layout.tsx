export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <p className="mb-2 text-center text-sm font-bold text-cyan-200">لعبة المهام اليومية</p>
        <h1 className="mb-6 text-center text-4xl font-black">مهام مارو جيصه</h1>
        <div className="card p-5 md:p-6">{children}</div>
      </div>
    </main>
  );
}
