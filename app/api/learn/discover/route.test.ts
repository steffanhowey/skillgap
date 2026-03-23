import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAdminClientMock,
  generateAndCachePathMock,
  startPipelineEventMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  generateAndCachePathMock: vi.fn(),
  startPipelineEventMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createClient: createAdminClientMock,
}));

vi.mock("@/lib/learn/pathGenerator", () => ({
  generateAndCachePath: generateAndCachePathMock,
}));

vi.mock("@/lib/pipeline/logger", () => ({
  startPipelineEvent: startPipelineEventMock,
}));

describe("GET /api/learn/discover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.LEGACY_LEARN_DISCOVERY_ENABLED;
  });

  afterEach(() => {
    delete process.env.LEGACY_LEARN_DISCOVERY_ENABLED;
  });

  it("returns a disabled response when legacy discovery is switched off", async () => {
    process.env.LEGACY_LEARN_DISCOVERY_ENABLED = "false";
    const { GET, POST } = await import("./route");

    const getResponse = await GET();
    const postResponse = await POST(
      new Request("http://localhost/api/learn/discover", {
        method: "POST",
      }),
    );

    await expect(getResponse.json()).resolves.toEqual({
      disabled: true,
      reason: "legacy_discovery_disabled",
    });
    await expect(postResponse.json()).resolves.toEqual({
      disabled: true,
      reason: "legacy_discovery_disabled",
    });
    expect(startPipelineEventMock).not.toHaveBeenCalled();
    expect(generateAndCachePathMock).not.toHaveBeenCalled();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });
});
