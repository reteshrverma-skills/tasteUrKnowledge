import { describe, expect, it } from "vitest";
import { fillMonths, recentMonths } from "@/lib/admin-stats";
import { axisTicks } from "@/components/MonthlyBarChart";

describe("recentMonths", () => {
  it("gives 12 months, oldest first, across the turn of the year", () => {
    const months = recentMonths(new Date("2026-11-05T12:00:00Z"));
    expect(months).toHaveLength(12);
    expect(months[0]).toMatchObject({ key: "2025-12", label: "Dec", fullLabel: "Dec 2025", count: 0 });
    expect(months[11].key).toBe("2026-11");
  });

  it("goes by the UK calendar, not UTC", () => {
    // 23:30 UTC on 31 August is already 00:30 on 1 September in BST.
    expect(recentMonths(new Date("2026-08-31T23:30:00Z"))[11]).toMatchObject({
      key: "2026-09",
      label: "Sep",
      fullLabel: "Sep 2026",
    });
  });

  it("does not skip a short month on the 31st", () => {
    const keys = recentMonths(new Date("2026-03-31T12:00:00Z")).map((m) => m.key);
    expect(keys.slice(-3)).toEqual(["2026-01", "2026-02", "2026-03"]);
  });
});

describe("fillMonths", () => {
  it("lays counts over the months and keeps empty months at zero", () => {
    const months = recentMonths(new Date("2026-11-05T12:00:00Z"));
    const filled = fillMonths(months, [{ month: "2026-10", count: BigInt(7) }]);
    expect(filled[10].count).toBe(7);
    expect(filled[11].count).toBe(0);
  });
});

describe("axisTicks", () => {
  it("uses whole numbers that reach the highest value", () => {
    expect(axisTicks(0)).toEqual([0, 1]);
    expect(axisTicks(1)).toEqual([0, 1]);
    expect(axisTicks(3)).toEqual([0, 1, 2, 3]);
    expect(axisTicks(7)).toEqual([0, 2, 4, 6, 8]);
    expect(axisTicks(38)).toEqual([0, 10, 20, 30, 40]);
    expect(axisTicks(1234)).toEqual([0, 500, 1000, 1500]);
  });
});
