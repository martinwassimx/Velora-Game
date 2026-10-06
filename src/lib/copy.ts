const ACHIEVEMENTS: Record<string, string> = {
  "أول مهمة": "First mission",
  "7 أيام متواصل": "Seven-day streak",
  "10 مهام": "Ten missions",
  "50 مهمة": "Fifty missions",
  "جامع الكوينز": "Coin collector",
  "أسطورة الاستمرار": "Streak legend",
};

export function englishCopy(text: string) {
  const named = ACHIEVEMENTS[text];
  if (named) return named;

  const level = /بقيت Level (\d+)/.exec(text);
  if (level) return `You reached level ${level[1]}.`;

  const daily = /خدت (\d+) كوين النهارده! الستريك: (\d+)/.exec(text);
  if (daily) return `You received ${daily[1]} coins today. Streak: ${daily[2]} days.`;

  const unlocked = /فتحت إنجاز: (.+)/.exec(text);
  if (unlocked) return `Achievement unlocked: ${ACHIEVEMENTS[unlocked[1]] ?? unlocked[1]}`;

  if (text.includes("إنجاز جديد")) return "New achievement";
  if (text.includes("مكافأة الدخول اليومية")) return "Daily login reward";
  if (text.includes("خلّصت أول مهمة")) return "Complete your first mission";
  if (text.includes("وصلت لستريك 7")) return "Reach a 7-day streak";
  if (text.includes("خلّصت 10 مهام")) return "Complete 10 missions";
  if (text.includes("خلّصت 50 مهمة")) return "Complete 50 missions";
  if (text.includes("وصلت للمستوى 10")) return "Reach level 10";
  if (text.includes("جمعت 500 كوين")) return "Earn 500 coins";
  if (text.includes("وصلت لستريك 30")) return "Reach a 30-day streak";
  return text;
}
