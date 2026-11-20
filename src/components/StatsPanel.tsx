import type { AdminStats } from "@/lib/admin-stats";

/** One figure: a big number with its label under it. */
function Figure({
  value,
  label,
  strong = false,
  unit,
}: {
  value: number;
  label: string;
  strong?: boolean;
  /** Shown small after the number, e.g. "h". */
  unit?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className={`font-display text-3xl font-bold tabular ${strong ? "text-brand" : "text-ink"}`}>
        {value.toLocaleString("en-GB", { maximumFractionDigits: 1 })}
        {unit && <span className="text-base font-semibold text-ink-soft ml-1">{unit}</span>}
      </p>
      <p className="text-sm text-ink-soft mt-0.5">{label}</p>
    </div>
  );
}

/**
 * Practice time across all students - today, this week, this month and all
 * time - on the statistics page. Figures are read fresh on every visit.
 */
export function StatsPanel({ stats }: { stats: AdminStats }) {
  const { practiceMinutes } = stats;
  return (
    <section className="card p-6" aria-labelledby="stats-heading">
      <h3 id="stats-heading" className="font-display text-xl font-semibold text-ink">
        Practice at a glance
      </h3>

      <p className="eyebrow mt-5 mb-2.5">Practice time, all students</p>
      <div className="grid grid-cols-2 gap-3">
        <Figure value={practiceMinutes.today} label="Today" unit="min" strong />
        <Figure value={practiceMinutes.week} label="This week" unit="min" />
        <Figure value={practiceMinutes.month} label="This month" unit="min" />
        <Figure value={practiceMinutes.allTime} label="All time" unit="min" />
      </div>
      <p className="text-xs text-ink-faint mt-2">
        Minutes answering questions in every subject, plus reading English passages. Counted by when each round started.
      </p>
    </section>
  );
}
