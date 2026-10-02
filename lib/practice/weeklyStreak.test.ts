import { describe, expect, it } from "vitest";
import { recentWeekStarts, weeklyStreak } from "./weeklyStreak";

const ZONE = "America/New_York";

describe("weeklyStreak", () => {
  it("puts Sunday 11:30pm and Monday 12:30am in different weeks", () => {
    const sundayNight = "2026-10-05T03:30:00.000Z";
    const mondayMorning = "2026-10-05T04:30:00.000Z";

    const fromSunday = weeklyStreak([sundayNight], new Date(sundayNight), ZONE);
    const afterMidnight = weeklyStreak([sundayNight], new Date(mondayMorning), ZONE);

    expect(fromSunday.practicedThisWeek).toBe(true);
    expect(fromSunday.count).toBe(1);
    expect(afterMidnight.practicedThisWeek).toBe(false);
    expect(afterMidnight.count).toBe(1);
    expect(afterMidnight.lastEightWeeks[7]).toBe(false);
    expect(afterMidnight.lastEightWeeks[6]).toBe(true);
    expect(recentWeekStarts(new Date(sundayNight), ZONE, 1)).not.toEqual(
      recentWeekStarts(new Date(mondayMorning), ZONE, 1),
    );
  });

  it("breaks the streak on a gap week and keeps it when this week is still open", () => {
    const sep14 = "2026-09-14T16:00:00.000Z";
    const sep28 = "2026-09-28T16:00:00.000Z";
    const now = new Date("2026-10-02T16:00:00.000Z");

    const gapped = weeklyStreak([sep14, sep28], now, ZONE);
    expect(gapped.practicedThisWeek).toBe(true);
    expect(gapped.count).toBe(1);

    const openWeek = weeklyStreak([sep28], new Date("2026-10-07T16:00:00.000Z"), ZONE);
    expect(openWeek.practicedThisWeek).toBe(false);
    expect(openWeek.count).toBe(1);
  });

  it("returns an empty history", () => {
    const result = weeklyStreak([], new Date("2026-10-02T16:00:00.000Z"), ZONE);
    expect(result).toEqual({
      count: 0,
      practicedThisWeek: false,
      lastEightWeeks: [false, false, false, false, false, false, false, false],
    });
  });
});
