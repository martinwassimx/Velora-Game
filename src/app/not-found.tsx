import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-3xl font-black">الصفحة مش موجودة</h1>
        <p className="mt-2 text-slate-300">الرابط ده مش موجود في اللعبة.</p>
        <Link href="/" className="btn btn-primary mt-5">
          رجوع للرئيسية
        </Link>
      </div>
    </main>
  );
}
