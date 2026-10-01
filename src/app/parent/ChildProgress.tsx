import type { SkillArea, SubjectTime } from "@/lib/progress";
import { formatDuration } from "@/lib/progress";
import { scoreStyle } from "@/lib/student";

const SUBJECT_TONE: Record<string, string> = {
  English: "bg-master",
  Maths: "bg-explorer",
};

/**
 * A list of topics with the score behind each.
 *
 * Strengths and weaknesses render identically on purpose: the percentage chip
 * already carries the verdict in its colour, so two differently shaped panels
 * would only make the pair harder to compare.
 */
function AreaList({ title, areas }: { title: string; areas: SkillArea[] }) {
  return (
    <div>
      <h4 className="eyebrow mb-2.5">{title}</h4>
      <ul className="space-y-2.5">
        {areas.map((area) => (
          <li
            key={`${area.subject}-${area.label}`}
            className="flex items-start gap-2.5"
          >
            <span
              className={`chip shrink-0 mt-0.5 ${scoreStyle(area.percentage)}`}
            >
              {area.percentage}%
            </span>
            <span className="min-w-0">
              <span className="text-sm font-medium text-ink">
                {area.subject} · {area.label}
              </span>
              {area.detail && (
                <span className="block text-xs text-ink-soft mt-0.5">
                  {area.detail}
                </span>
              )}
              <span className="block text-[11px] text-ink-faint mt-0.5 tabular">
                {area.attempted} question
                {area.attempted === 1 ? "" : "s"} answered
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * One child's time, strengths and trouble spots.
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
 * Either panel is dropped entirely when it has nothing in it - a heading over
 * an admission that there is nothing to say is worse than no heading.
 */
export function ChildProgress({
  times,
  strengths,
  weaknesses,
}: {
  times: SubjectTime[];
  strengths: SkillArea[];
  weaknesses: SkillArea[];
}) {
  // Keyed off all-time, not this month: a child who practised last month but
  // not yet this one has a table worth showing, which is the whole point of
  // the all-time column.
  const anyTime = times.some((t) => t.allTimeSeconds > 0);
  const panels = [
    { title: "Strengths", areas: strengths },
    { title: "Need to work on", areas: weaknesses },
  ].filter((panel) => panel.areas.length > 0);

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
            <col className="w-[28%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr className="eyebrow">
              <th className="text-left pb-1.5 font-semibold">Subject</th>
              <th className="text-right pb-1.5 font-semibold">Today</th>
              <th className="text-right pb-1.5 font-semibold">This week</th>
              <th className="text-right pb-1.5 font-semibold">This month</th>
              <th className="text-right pb-1.5 font-semibold">All time</th>
            </tr>
          </thead>
          <tbody>
            {times.map((row) => (
              <tr key={row.subject} className="border-t border-line">
                <td className="py-2 font-medium text-ink">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        SUBJECT_TONE[row.subject] ?? "bg-ink-faint"
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
                    picture, and it lines up with the all-time Strengths below. */}
                <td className="py-2 text-right tabular font-semibold text-ink">
                  {formatDuration(row.allTimeSeconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Strengths and weaknesses, side by side when there are both */}
      {panels.length > 0 && (
        <div
          className={`mt-5 grid grid-cols-1 gap-5 ${
            panels.length === 2 ? "lg:grid-cols-2" : ""
          }`}
        >
          {panels.map((panel) => (
            <AreaList
              key={panel.title}
              title={panel.title}
              areas={panel.areas}
            />
          ))}
        </div>
      )}
    </div>
  );
}
