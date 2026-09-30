"use client";

export default function GameError({ error, reset }: { error: Error; reset: () => void }) {
  const message = /[\u0600-\u06FF]/.test(error.message) ? error.message : "حصل مشكلة وأحنا بنحمّل الصفحة.";
  return (
    <div className="card p-6 text-center">
      <h1 className="text-2xl font-black">فيه حاجة وقفت</h1>
      <p className="mt-2 text-slate-300">{message}</p>
      <button className="btn btn-primary mt-4" onClick={reset}>
        جرّب تاني
      </button>
    </div>
  );
}
