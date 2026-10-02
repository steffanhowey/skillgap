import { describe, expect, it } from "vitest";
import { readMissionRoomHandoffFromSearch } from "./missionRoomHandoff";

describe("readMissionRoomHandoffFromSearch", () => {
  it("reads a locked mission from query params", () => {
    const handoff = readMissionRoomHandoffFromSearch(
      "missionId=path-1&missionTitle=Research+Brief&missionDomain=Research+%26+Insight",
    );

    expect(handoff).toEqual({
      missionId: "path-1",
      missionTitle: "Research Brief",
      missionDomain: "Research & Insight",
      missionStepIndex: null,
      missionStepTitle: null,
    });
  });

  it("returns null when no mission is in the query", () => {
    expect(readMissionRoomHandoffFromSearch("foo=bar")).toBeNull();
  });
});
