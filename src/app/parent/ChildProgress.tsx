import Link from "next/link";
import type { ProgressSubject, SubjectTime } from "@/lib/progress";
import { formatDuration, slugForSubject } from "@/lib/progress";

/** One dot colour per subject, shared with the details page. */
export const SUBJECT_TONE: Record<ProgressSubject, string> = {
  English: "bg-master",
  Maths: "bg-explorer",
  "Verbal Reasoning": "bg-challenger",
  "Non-Verbal": "bg-navigator",
};

/** What each subject's topics are, in a parent's words. */
export const SUBJECT_HEADING: Record<ProgressSubject, string> = {
  English: "English comprehension · by question type",
  Maths: "Maths · by topic",
  "Verbal Reasoning": "Verbal Reasoning · by topic",
  "Non-Verbal": "Non-Verbal Reasoning · by topic",
};

/** The per-subject details page for this child. */
function detailsHref(studentId: number, subject: ProgressSubject) {
  return `/parent/kids/${studentId}/progress/${slugForSubject(subject)}`;
}

function DetailsLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="btn-quiet px-2.5 py-1 text-xs whitespace-nowrap"
    >
      Details
    </Link>
  );
}

/**
 * One child's time spent per subject, each with a Details button.
 *
 * Time is shown per subject across three windows because the three answer
 * different questions: today is "did they sit down", the week is "are they
 * keeping it up", the month is "is this actually a habit".
 *
 * The table is `table-fixed` with explicit column widths rather than the
 * default auto layout. Auto sizes each column from its own header, so
 * "This month" claimed nearly twice the width of "Today" and the three
 * figures drifted further apart across the row instead of reading as one set.
 *
 * Strengths and weaknesses live on each subject's details page, not here.
 */
export function ChildProgress({
  studentId,
  times,
}: {
  studentId: number;
  times: SubjectTime[];
}) {
  // Keyed off all-time, not this month: a child who practised last month but
  // not yet this one has a table worth showing, which is the whole point of
  // the all-time column.
  const anyTime = times.some((t) => t.allTimeSeconds > 0);

  return (
    <div className="mt-5 pt-5 border-t border-line">
      {/* Time spent */}
      <h4 className="eyebrow mb-2.5">Time spent</h4>

      {!anyTime ? (
        <p className="text-sm text-ink-faint">
          Nothing practised yet.
        </p>
      ) : (
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr className="eyebrow">
              <th className="text-left pb-1.5 font-semibold">Subject</th>
              <th className="text-right pb-1.5 font-semibold">Today</th>
              <th className="text-right pb-1.5 font-semibold">This week</th>
              <th className="text-right pb-1.5 font-semibold">This month</th>
              <th className="text-right pb-1.5 font-semibold">All time</th>
              <th className="pb-1.5">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {times.map((row) => (
              <tr key={row.subject} className="border-t border-line">
                <td className="py-2 font-medium text-ink">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        SUBJECT_TONE[row.subject]
                      }`}
                    />
                    {row.subject}
                  </span>
                </td>
                <td className="py-2 text-right tabular text-ink-soft">
                  {formatDuration(row.todaySeconds)}
                </td>
                <td className="py-2 text-right tabular text-ink-soft">
                  {formatDuration(row.weekSeconds)}
                </td>
                <td className="py-2 text-right tabular text-ink-soft">
                  {formatDuration(row.monthSeconds)}
                </td>
                {/* All-time is the emphasised figure: it always has the full
                    picture, even early in a month or week. */}
                <td className="py-2 text-right tabular font-semibold text-ink">
                  {formatDuration(row.allTimeSeconds)}
                </td>
                <td className="py-2 text-right">
                  <DetailsLink href={detailsHref(studentId, row.subject)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
