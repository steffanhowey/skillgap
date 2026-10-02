export interface WeeklyStreak {
  count: number;
  practicedThisWeek: boolean;
  /** Oldest first. The last entry is the current week. */
  lastEightWeeks: boolean[];
}

/**
 * Monday-start weeks in `timeZone`.
 * The current week does not break the streak when it has no mission yet.
 * A week with no mission between two practiced weeks does.
 */
export function weeklyStreak(
  completedAt: string[],
  now: Date,
  timeZone: string,
): WeeklyStreak {
  const practiced = new Set(
    completedAt.map((value) => weekKey(new Date(value), timeZone)),
  );
  const current = weekKey(now, timeZone);
  const practicedThisWeek = practiced.has(current);
  const lastEightWeeks = weekKeysEndingAt(current, 8).map((key) => practiced.has(key));

  let cursor = practicedThisWeek ? current : shiftWeek(current, -1);
  let count = 0;
  while (practiced.has(cursor)) {
    count += 1;
    cursor = shiftWeek(cursor, -1);
  }

  return { count, practicedThisWeek, lastEightWeeks };
}

/**
 * Monday dates, `YYYY-MM-DD`, oldest first, ending on the week that contains `now`.
 */
export function recentWeekStarts(now: Date, timeZone: string, weeks: number): string[] {
  return weekKeysEndingAt(weekKey(now, timeZone), weeks);
}

function weekKeysEndingAt(currentKey: string, weeks: number): string[] {
  const keys: string[] = [];
  for (let index = weeks - 1; index >= 0; index -= 1) {
    keys.push(shiftWeek(currentKey, -index));
  }
  return keys;
}

function weekKey(date: Date, timeZone: string): string {
  const parts = zonedParts(date, timeZone);
  const monday = addDays(parts, -(parts.weekday - 1));
  return isoDate(monday);
}

function shiftWeek(mondayKey: string, weeks: number): string {
  const [year, month, day] = mondayKey.split("-").map(Number);
  return isoDate(addDays({ year, month, day, weekday: 1 }, weeks * 7));
}

interface ZonedDate {
  year: number;
  month: number;
  day: number;
  weekday: number;
}

function zonedParts(date: Date, timeZone: string): ZonedDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekday: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    weekday: weekday[read("weekday")] ?? 1,
  };
}

function addDays(date: ZonedDate, days: number): ZonedDate {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
    weekday: 1,
  };
}

function isoDate(date: ZonedDate): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}
