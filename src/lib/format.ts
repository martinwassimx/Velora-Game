export function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-EG", { numberingSystem: "latn" }).format(value);
}

export function formatDate(value: string | null | undefined, timeZone = "Africa/Cairo") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
    numberingSystem: "latn",
  }).format(date);
}

export function formatDay(value: string | null | undefined, timeZone = "Africa/Cairo") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeZone,
    numberingSystem: "latn",
  }).format(date);
}

export function xpPercent(xp: number, floorXp: number, nextXp: number) {
  const span = Math.max(1, nextXp - floorXp);
  return Math.max(0, Math.min(100, ((xp - floorXp) / span) * 100));
}

export function zonedInputToIso(value: string, timeZone = "Africa/Cairo") {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const utcGuess = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(utcGuess));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const zonedAsUtc = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"));
  return new Date(utcGuess - (zonedAsUtc - utcGuess)).toISOString();
}

export function toLocalInput(value: string | null, timeZone = "Africa/Cairo") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
