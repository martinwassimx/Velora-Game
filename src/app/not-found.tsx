import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-3xl font-black">Page not found</h1>
        <p className="mt-2 text-[#a1a1aa]">That link doesn't exist in the game.</p>
        <Link href="/" className="btn btn-primary mt-5">
          Back home
        </Link>
      </div>
    </main>
  );
}
