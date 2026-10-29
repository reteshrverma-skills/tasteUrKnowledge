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
 * Accounts by type, student logins this day, week and month, and practice
 * time, on the Product Director's page. Figures are read fresh on every visit.
 */
export function StatsPanel({ stats }: { stats: AdminStats }) {
  const { accounts, inactive, studentLogins, practiceMinutes } = stats;
  return (
    <section className="card p-6 mb-8" aria-labelledby="stats-heading">
      <h3 id="stats-heading" className="font-display text-xl font-semibold text-ink">
        Users at a glance
      </h3>

      <p className="eyebrow mt-5 mb-2.5">Accounts</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Figure value={accounts.students} label="Students" />
        <Figure value={accounts.parents} label="Parents" />
        <Figure value={accounts.admins} label="Admins" />
        <Figure value={accounts.directors} label="Product Directors" />
        <Figure value={accounts.total} label="Total" strong />
      </div>
      {inactive > 0 && (
        <p className="text-xs text-ink-faint mt-2">
          Includes {inactive.toLocaleString("en-GB")} inactive account{inactive === 1 ? "" : "s"}.
        </p>
      )}

      <p className="eyebrow mt-6 mb-2.5">Students who logged in</p>
      <div className="grid grid-cols-3 gap-3">
        <Figure value={studentLogins.today} label="Today" strong />
        <Figure value={studentLogins.week} label="This week" />
        <Figure value={studentLogins.month} label="This month" />
      </div>
      <p className="text-xs text-ink-faint mt-2">
        Each student counted once per period, however often they log in. UK time; the week starts on Monday.
      </p>

      <p className="eyebrow mt-6 mb-2.5">Practice time, all students</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
