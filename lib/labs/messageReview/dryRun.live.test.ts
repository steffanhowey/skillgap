import OpenAI from "openai";
import { config } from "dotenv";
import { describe, expect, it } from "vitest";
import { runInternalDryComparison } from "./dryRun";
import { getInternalDryComparisonFixtures } from "./fixtures";

config({ path: ".env.local", quiet: true });

const describeLive =
  process.env.RUN_MESSAGE_REVIEW_LIVE === "1" ? describe : describe.skip;

describeLive("message review internal dry comparisons", () => {
  it(
    "runs the three fixed same-model comparisons",
    async () => {
      const client = new OpenAI();
      const results = [];
      const requestedFixtureIds = new Set(
        (process.env.MESSAGE_REVIEW_FIXTURE_IDS ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
      const fixtures = getInternalDryComparisonFixtures().filter(
        (fixture) =>
          requestedFixtureIds.size === 0 ||
          requestedFixtureIds.has(fixture.id),
      );

      for (const fixture of fixtures) {
        results.push(await runInternalDryComparison(client, fixture));
      }

      console.log(
        JSON.stringify(
          results.map((result) => ({
            fixture: result.fixtureId,
            specialistExpectationMet: result.specialistExpectationMet,
            winner: result.winner,
            baselineRules: result.baselineRuleIds,
            specialistRules: result.specialistRuleIds,
          })),
          null,
          2,
        ),
      );

      expect(results).toHaveLength(fixtures.length);
      expect(results.every((result) => result.specialistExpectationMet)).toBe(
        true,
      );
    },
    120_000,
  );
});
