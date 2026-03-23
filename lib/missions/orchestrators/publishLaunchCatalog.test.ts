import { beforeEach, describe, expect, it, vi } from "vitest";

const { promoteVisibleControlLanePathsMock } = vi.hoisted(() => ({
  promoteVisibleControlLanePathsMock: vi.fn(),
}));

vi.mock("@/lib/missions/services/controlLaneVisibilityService", () => ({
  promoteVisibleControlLanePaths: promoteVisibleControlLanePathsMock,
}));

import { publishLaunchCatalog } from "./publishLaunchCatalog";

describe("publishLaunchCatalog", () => {
  beforeEach(() => {
    promoteVisibleControlLanePathsMock.mockReset();
    promoteVisibleControlLanePathsMock.mockResolvedValue({
      promoted: [],
      promotedCount: 1,
      alreadyVisibleCount: 0,
      hiddenCount: 0,
    });
  });

  it("publishes only the approved rollout slice", async () => {
    const result = await publishLaunchCatalog();

    expect(promoteVisibleControlLanePathsMock).toHaveBeenCalledTimes(3);
    expect(promoteVisibleControlLanePathsMock).toHaveBeenNthCalledWith(1, {
      topicSlug: "prompt-engineering",
      professionalFunction: "marketing",
      fluencyLevel: "practicing",
      allowedFamilies: ["research-synthesis", "messaging-translation"],
    });
    expect(promoteVisibleControlLanePathsMock).toHaveBeenNthCalledWith(2, {
      topicSlug: "claude-code",
      professionalFunction: "marketing",
      fluencyLevel: "practicing",
      allowedFamilies: ["research-synthesis", "messaging-translation"],
    });
    expect(promoteVisibleControlLanePathsMock).toHaveBeenNthCalledWith(3, {
      topicSlug: "github-copilot",
      professionalFunction: "marketing",
      fluencyLevel: "practicing",
      allowedFamilies: ["research-synthesis"],
    });
    expect(result.promotedCount).toBe(3);
  });

  it("rejects unsupported topic scopes", async () => {
    await expect(
      publishLaunchCatalog({ topicSlugs: ["model-context-protocol"] }),
    ).rejects.toThrow("unsupported topic scope");
    expect(promoteVisibleControlLanePathsMock).not.toHaveBeenCalled();
  });
});
