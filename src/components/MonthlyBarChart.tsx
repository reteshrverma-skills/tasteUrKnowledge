import type { MonthCount } from "@/lib/admin-stats";

/** The plot's height in pixels; bars and gridlines are measured against it. */
const PLOT_HEIGHT = 160;

const num = (value: number) => value.toLocaleString("en-GB");

/** Whole-number axis ticks from 0, on a 1, 2 or 5 step, reaching at least `max`. */
export function axisTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step =
    [0.1, 0.2, 0.5, 1, 2, 5, 10]
      .map((m) => Math.round(m * magnitude * 10) / 10)
      .filter((s) => Number.isInteger(s))
      .find((s) => Math.ceil(max / s) <= 4) ?? magnitude * 10;
  const top = Math.ceil(max / step);
  return Array.from({ length: top + 1 }, (_, i) => i * step);
}

/**
 * One measure month by month, as columns. Hover or focus on a column shows its
 * figure, and only the latest and the busiest month are labelled on the chart;
 * "Show figures" lists every month.
 */
export function MonthlyBarChart({
  title,
  unit,
  months,
}: {
  title: string;
  /** What is being counted, e.g. "student accounts". */
  unit: string;
  months: MonthCount[];
}) {
  const total = months.reduce((sum, m) => sum + m.count, 0);
  const max = Math.max(...months.map((m) => m.count));
  const ticks = axisTicks(max);
  const top = ticks[ticks.length - 1];
  const peakIndex = months.findIndex((m) => m.count === max);
  const lastIndex = months.length - 1;
  const heightOf = (value: number) => (value / top) * PLOT_HEIGHT;

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink tabular">{num(total)}</span> in 12 months
        </p>
      </div>
      <p className="text-xs text-ink-faint mt-0.5">
        {months[0].fullLabel} to {months[lastIndex].fullLabel}, by month. UK time.
      </p>

      {/* The top margin leaves room for a label on a full-height column. */}
      <div className="flex gap-2 mt-7">
        <div className="relative w-9 shrink-0" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 translate-y-1/2 text-xs text-ink-faint tabular"
              style={{ bottom: heightOf(t) }}
            >
              {t >= 10_000 ? `${num(t / 1000)}K` : num(t)}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative" style={{ height: PLOT_HEIGHT }}>
            {ticks.map((t) => (
              <span
                key={t}
                aria-hidden="true"
                className={`absolute inset-x-0 h-px ${t === 0 ? "bg-line-strong" : "bg-line"}`}
                style={{ bottom: heightOf(t) }}
              />
            ))}
            <div className="absolute inset-0 flex">
              {months.map((m, i) => (
                <div
                  key={m.key}
                  tabIndex={0}
                  role="img"
                  aria-label={`${m.fullLabel}: ${num(m.count)} ${unit}`}
                  className="group relative flex-1 min-w-0 flex items-end justify-center px-px"
                >
                  <div
                    className="relative w-full max-w-6 rounded-t bg-brand group-hover:bg-brand-hover group-focus:bg-brand-hover"
                    style={{ height: m.count > 0 ? Math.max(heightOf(m.count), 3) : 0 }}
                  >
                    {m.count > 0 && (i === lastIndex || i === peakIndex) && (
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 text-xs font-semibold text-ink tabular">
                        {num(m.count)}
                      </span>
                    )}
                  </div>
                  {/* Opens inward at each end, so it stays on the card. */}
                  <div
                    aria-hidden="true"
                    className={`hidden group-hover:block group-focus:block absolute z-10 top-2 pointer-events-none whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-1.5 shadow-md text-xs ${
                      i < months.length / 2 ? "left-0" : "right-0"
                    }`}
                  >
                    <span className="font-semibold text-ink tabular">{num(m.count)}</span>{" "}
                    <span className="text-ink-soft">· {m.fullLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex mt-1.5" aria-hidden="true">
            {months.map((m) => (
              <span key={m.key} className="flex-1 min-w-0 text-center text-[11px] text-ink-faint">
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-ink-soft hover:text-ink">
          Show figures
        </summary>
        <table className="mt-2 w-full max-w-xs text-sm">
          <caption className="sr-only">{title}, by month</caption>
          <thead>
            <tr className="text-left text-xs text-ink-faint">
              <th scope="col" className="font-medium py-1">Month</th>
              <th scope="col" className="font-medium py-1 text-right">New</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {months.map((m) => (
              <tr key={m.key}>
                <th scope="row" className="font-normal text-ink-soft text-left py-1">{m.fullLabel}</th>
                <td className="text-ink tabular text-right py-1">{num(m.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
