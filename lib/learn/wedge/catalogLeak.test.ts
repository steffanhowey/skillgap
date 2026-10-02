import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PUBLIC_SURFACES = [
  "lib/homeLaunchpad.ts",
  "lib/missionCatalogRecommendations.ts",
  "lib/missionRecommendations.ts",
  "components/missions/MissionsPage.tsx",
  "app/(marketing)/page.tsx",
] as const;

describe("launch messaging catalog leak", () => {
  it("does not mention the hidden path on public surfaces", () => {
    for (const relativePath of PUBLIC_SURFACES) {
      const source = readFileSync(relativePath, "utf8");
      expect(source).not.toContain("launch-messaging");
      expect(source).not.toContain("Launch messaging");
    }
  });
});
