import { describe, expect, it } from "vitest";
import { practiceCalendar } from "./practiceCalendar";

describe("practiceCalendar", () => {
  it("returns twelve Monday-first weeks and counts the day", () => {
    const now = new Date("2026-10-02T16:00:00.000Z");
    const weeks = practiceCalendar(["2026-10-02T16:00:00.000Z", "2026-10-02T18:00:00.000Z"], now, "America/New_York");

    expect(weeks).toHaveLength(12);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]?.[0]?.date).toBe("2026-07-13");
    expect(weeks[11]?.[0]?.date).toBe("2026-09-28");
    expect(weeks[11]?.[4]).toEqual({ date: "2026-10-02", count: 2 });
    expect(weeks[11]?.[6]?.date).toBe("2026-10-04");
  });
});