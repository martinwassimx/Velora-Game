export function arabicError(message: string | undefined | null, code?: string | null) {
  if (!message && !code) return "حصل مشكلة، جرّب تاني";
  const index = message?.search(/[\u0600-\u06FF]/) ?? -1;
  if (message && index >= 0) return message.slice(index).trim();

  const lower = `${code ?? ""} ${message ?? ""}`.toLowerCase();
  if (lower.includes("over_email_send_rate_limit") || lower.includes("rate limit") || lower.includes("error sending confirmation")) {
    return "Supabase وقف إرسال الإيميلات مؤقتًا لكثرة المحاولات. من لوحة Supabase افتح Authentication ثم Providers ثم Email، واقفل Confirm email، وبعدين اعمل الحساب تاني.";
  }
  if (lower.includes("database error saving new user") || lower.includes("unexpected_failure")) {
    return "الحساب ما اتسجلش في قاعدة البيانات. اتأكد إن ملف SQL اتنفذ في Supabase.";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "الإيميل أو الباسورد مش صح";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "الإيميل ده متسجل قبل كده";
  }
  if (lower.includes("email not confirmed")) {
    return "أكّد الإيميل الأول من الرسالة اللي بعتناها";
  }
  if (lower.includes("password")) return "الباسورد ضعيف أو مش مظبوط";
  if (lower.includes("duplicate") || lower.includes("unique")) return "القيمة دي موجودة قبل كده";
  if (lower.includes("jwt") || lower.includes("not authenticated")) return "لازم تسجل دخول تاني";
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("failed to fetch")) {
    return "مفيش اتصال بالسيرفر";
  }
  if (lower.includes("supabase") || lower.includes("missing")) {
    return "اتصال Supabase مش متظبط. راجع ملف البيئة.";
  }
  return "حصل مشكلة، جرّب تاني";
}
