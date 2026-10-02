import { describe, expect, it } from "vitest";

import {
  LAUNCH_MESSAGING_ROUTE,
  getMissionRoute,
  getMissionSoloRoute,
} from "@/lib/appRoutes";

describe("mission routes", () => {
  it("keeps the briefing and solo runner on separate paths", () => {
    expect(getMissionRoute("path-1")).toBe("/missions/path-1");
    expect(getMissionSoloRoute("path-1")).toBe("/missions/path-1/solo");
    expect(getMissionSoloRoute("path-1", 2)).toBe("/missions/path-1/solo?step=2");
  });

  it("keeps launch messaging on a static hidden path", () => {
    expect(LAUNCH_MESSAGING_ROUTE).toBe("/missions/launch-messaging");
  });
});
