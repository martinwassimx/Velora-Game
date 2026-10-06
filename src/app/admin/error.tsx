"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  const message = /[\u0600-\u06FF]/.test(error.message) ? error.message : "Something went wrong in the admin panel.";
  return (
    <div className="card p-6 text-center">
      <h1 className="text-2xl font-black">Something went wrong</h1>
      <p className="mt-2 text-[#a1a1aa]">{message}</p>
      <button className="btn btn-primary mt-4" onClick={reset}>Try again</button>
    </div>
  );
}
