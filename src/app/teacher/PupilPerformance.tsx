import Link from "next/link";
import type { PupilRow } from "@/lib/school";
import { pupilHref } from "./links";

/**
 * The teacher's Performance panel: pupils by name. Each opens that pupil's
 * page - time spent per subject, with Details per subject - as a parent's
 * dashboard shows a child.
 */
export function PupilPerformance({ pupils }: { pupils: PupilRow[] }) {
  return (
    <section className="card p-6 sm:p-8">
      <h2 className="font-display text-lg font-semibold text-ink mb-4">Performance</h2>
      {pupils.length === 0 ? (
        <p className="text-sm text-ink-faint">No pupils yet.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pupils.map((p) => (
            <li key={p.studentId}>
              <Link
                href={pupilHref(p.studentId)}
                className="flex items-center gap-3 rounded-xl border border-line-strong bg-surface px-4 py-3 hover:border-brand hover:shadow-sm transition"
              >
                <span className="w-9 h-9 rounded-full bg-brand-tint text-brand grid place-items-center font-display font-semibold shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-ink truncate">{p.name}</span>
                  <span className="block text-xs text-ink-faint">{p.yearName}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
