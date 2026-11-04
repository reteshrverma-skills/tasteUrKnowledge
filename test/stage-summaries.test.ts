import { describe, expect, it } from "vitest";
import { OTHER_STAGE, stageSummaries, type RecentTest } from "@/lib/progress";

function test_(level: string | null, correct: number, total: number): RecentTest {
  return {
    id: 1,
    startedAt: null,
    label: "Test",
    level,
    correct,
    total,
    percentage: Math.round((correct / total) * 100),
  };
}

describe("stageSummaries", () => {
  it("groups by stage in ladder order, leaving out stages not tried", () => {
    const stages = stageSummaries([
      test_("Challenger", 2, 9),
      test_("Starter", 8, 9),
      test_("Navigator", 9, 9),
    ]);
    expect(stages.map((s) => s.stage)).toEqual(["Starter", "Navigator", "Challenger"]);
  });

  it("scores across all answers, so a long round counts for more", () => {
    const [starter] = stageSummaries([test_("Starter", 0, 1), test_("Starter", 9, 9)]);
    expect(starter).toMatchObject({ tests: 2, correct: 9, total: 10, percentage: 90 });
  });

  it("matches the level ignoring case", () => {
    const stages = stageSummaries([test_("starter", 1, 2), test_("Starter", 1, 2)]);
    expect(stages).toHaveLength(1);
    expect(stages[0].stage).toBe("Starter");
  });

  it("counts an empty or unknown level under Other, last", () => {
    const stages = stageSummaries([
      test_(null, 1, 2),
      test_("Comp", 1, 2),
      test_("Master", 1, 2),
    ]);
    expect(stages.map((s) => s.stage)).toEqual(["Master", OTHER_STAGE]);
    expect(stages[1].tests).toBe(2);
  });
});
