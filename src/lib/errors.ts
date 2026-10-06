const KNOWN: [string, string][] = [
  ["لازم تسجل دخول", "Sign in to continue"],
  ["مش مسموحلك بالعملية دي", "You can't do that"],
  ["الحساب بتاعك متوقف", "This account is suspended"],
  ["المستخدم مش موجود", "That player doesn't exist"],
  ["اسم المستخدم لازم يكون من 3", "Username must be 3 to 24 characters"],
  ["اسم المستخدم فيه رموز", "That username has characters that aren't allowed"],
  ["الاسم ده متاخد", "That username is taken"],
  ["صورة البروفايل مش صحيحة", "That profile photo isn't valid"],
  ["مش مسموح تعدل بروفايل حد تاني", "You can only edit your own profile"],
  ["مكافأة غير صحيحة", "That reward isn't valid"],
  ["مكافآت الدخول مش متظبطة", "Daily rewards aren't set up yet"],
  ["المكافأة اتاخدت قبل كده", "You already claimed today's reward"],
  ["المهمة مش موجودة", "That mission doesn't exist"],
  ["المهمة مش متاحة دلوقتي", "That mission isn't available"],
  ["ميعاد المهمة خلّص", "That mission has expired"],
  ["المهمة دي مش بتاعتك", "This mission isn't assigned to you"],
  ["لازم ترفع صورة المهمة", "This mission needs a photo"],
  ["مسار الصورة مش صحيح", "That photo path isn't valid"],
  ["الملاحظة طويلة", "That note is too long"],
  ["عندك طلب مستني المراجعة", "You already have a submission in review for this mission"],
  ["خلّصت المهمة دي قبل كده", "You already completed this mission"],
  ["مش مسموح تبعت المهمة دي تاني", "You can't submit this mission again"],
  ["وصلت للحد الأقصى", "You've used every attempt"],
  ["عنوان المهمة لازم", "The title must be 2 to 120 characters"],
  ["وصف المهمة طويل", "That description is too long"],
  ["اختار مستوى الصعوبة", "Pick a difficulty"],
  ["المكافأة لازم تكون رقم", "The reward must be a number"],
  ["المكافأة أكبر من المسموح", "That reward is too large"],
  ["عدد مرات التسليم", "The attempt limit isn't valid"],
  ["طريقة التعيين مش صحيحة", "That assignment option isn't valid"],
  ["ميعاد التسليم مش صحيح", "That deadline isn't valid"],
  ["اختار اللاعبين", "Pick the players who should receive this mission"],
  ["الطلب مش موجود", "That submission doesn't exist"],
  ["الطلب ده اتراجع قبل كده", "That submission was already reviewed"],
  ["اكتب سبب الرفض", "Write a rejection reason"],
  ["سبب الرفض طويل", "That rejection reason is too long"],
  ["قيمة الـ XP مش مسموحة", "That XP amount isn't allowed"],
  ["قيمة الكوينز مش مسموحة", "That coin amount isn't allowed"],
  ["متقدرش تغيّر صلاحيتك بنفسك", "You can't change your own role"],
  ["الصلاحية مش صحيحة", "That role isn't valid"],
  ["متقدرش توقف حسابك", "You can't suspend your own account"],
  ["اكتب سبب الإيقاف", "Write a suspension reason"],
  ["المهمة دي لأول واحد بس", "Only the first player can take this mission, and someone already did."],
];

export function arabicError(message: string | undefined | null, code?: string | null) {
  if (!message && !code) return "Something went wrong. Try again.";
  if (message) {
    const known = KNOWN.find(([arabic]) => message.includes(arabic));
    if (known) return known[1];
    const index = message.search(/[\u0600-\u06FF]/);
    if (index >= 0) return "Something went wrong. Try again.";
  }

  const lower = `${code ?? ""} ${message ?? ""}`.toLowerCase();
  if (lower.includes("over_email_send_rate_limit") || lower.includes("rate limit") || lower.includes("error sending confirmation")) {
    return "Email sending is paused after too many attempts. In Supabase, open Authentication, Providers, Email, turn off Confirm email, then create the account again.";
  }
  if (lower.includes("database error saving new user") || lower.includes("unexpected_failure")) {
    return "The account was not saved. Make sure the SQL file has been run in Supabase.";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Email or password is incorrect";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "That email is already registered";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email from the message we sent";
  }
  if (lower.includes("password")) return "That password is too weak or not valid";
  if (lower.includes("duplicate") || lower.includes("unique")) return "That value is already in use";
  if (lower.includes("jwt") || lower.includes("not authenticated")) return "Sign in again";
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("failed to fetch")) {
    return "Can't reach the server";
  }
  if (lower.includes("supabase") || lower.includes("missing")) {
    return "Supabase isn't configured. Check the environment file.";
  }
  return "Something went wrong. Try again.";
}
