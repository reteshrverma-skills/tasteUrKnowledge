/** Whole-number percentage of marks; 0 when there are no marks. */
export function percent(awarded: number, total: number): number {
  return total > 0 ? Math.round((awarded / total) * 100) : 0;
}

/** e.g. "12 Mar 2026"; testDate is a DATE so it is shown in UTC. */
export function formatDate(date: Date | null): string {
  return date
    ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    : "No date";
}
