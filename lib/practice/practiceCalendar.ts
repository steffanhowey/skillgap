export interface PracticeDay {
  /** Calendar date in the learner's time zone, `YYYY-MM-DD`. */
  date: string;
  count: number;
}

/**
 * Twelve Monday-first weeks ending on the week that contains `now`.
 * Each cell is a count of missions finished that day.
 */
export function practiceCalendar(
  completedAt: string[],
  now: Date,
  timeZone: string,
): PracticeDay[][] {
  const counts = new Map<string, number>();
  for (const value of completedAt) {
    const key = zonedDateKey(new Date(value), timeZone);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = zonedYmd(new Date(now), timeZone);
  const monday = addDays(today, -(today.weekday - 1));
  const start = addDays(monday, -11 * 7);
  const weeks: PracticeDay[][] = [];

  for (let week = 0; week < 12; week += 1) {
    const days: PracticeDay[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = addDays(start, week * 7 + day);
      const key = isoDate(date);
      days.push({ date: key, count: counts.get(key) ?? 0 });
    }
    weeks.push(days);
  }

  return weeks;
}

interface Ymd {
  year: number;
  month: number;
  day: number;
  weekday: number;
}

function zonedDateKey(date: Date, timeZone: string): string {
  return isoDate(zonedYmd(date, timeZone));
}

function zonedYmd(date: Date, timeZone: string): Ymd {
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

function addDays(date: Ymd, days: number): Ymd {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  utc.setUTCDate(utc.getUTCDate() + days);
  const shifted = new Date(utc);
  const weekday = ((shifted.getUTCDay() + 6) % 7) + 1;
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday,
  };
}

function isoDate(date: Ymd): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}
