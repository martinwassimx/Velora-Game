import { BrandMark } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark size="sm" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a1a1aa]">Daily missions</p>
            <h1 className="text-3xl font-extrabold leading-none">Velora</h1>
          </div>
        </div>
        <div className="card p-5 md:p-6">{children}</div>
      </div>
    </main>
  );
}
