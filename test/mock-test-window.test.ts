import { describe, expect, it } from "vitest";
import { paperWindow } from "@/lib/mock-test";

const day = (s: string) => new Date(`${s}T00:00:00Z`);

describe("paperWindow", () => {
  it("closes at 23:59:59 UK time in winter (GMT)", () => {
    const { opensAt, closesAt, lastDay } = paperWindow(day("2026-11-20"), 7);
    expect(lastDay).toBe("2026-11-26");
    expect(opensAt.toISOString()).toBe("2026-11-20T00:00:00.000Z");
    expect(closesAt.toISOString()).toBe("2026-11-26T23:59:59.000Z");
  });

  it("closes at 23:59:59 UK time in summer (BST is UTC+1)", () => {
    const { opensAt, closesAt } = paperWindow(day("2026-07-01"), 1);
    expect(opensAt.toISOString()).toBe("2026-06-30T23:00:00.000Z");
    expect(closesAt.toISOString()).toBe("2026-07-01T22:59:59.000Z");
  });

  it("uses each end's own offset when the clocks change while it is open", () => {
    // Clocks go forward on 29 March 2026: opens in GMT, closes in BST.
    const { opensAt, closesAt, lastDay } = paperWindow(day("2026-03-27"), 5);
    expect(lastDay).toBe("2026-03-31");
    expect(opensAt.toISOString()).toBe("2026-03-27T00:00:00.000Z");
    expect(closesAt.toISOString()).toBe("2026-03-31T22:59:59.000Z");
  });

  it("rolls over the end of a month", () => {
    expect(paperWindow(day("2026-01-30"), 3).lastDay).toBe("2026-02-01");
  });
});
