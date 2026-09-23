import type { SkillArea, SubjectTime } from "@/lib/progress";
import { formatDuration } from "@/lib/progress";

/** The same green / amber / red bands as the score chips elsewhere. */
function scoreTone(percentage: number): string {
  if (percentage >= 70) return "bg-green-100 text-green-800 border-green-300";
  if (percentage >= 40) return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-red-100 text-red-700 border-red-300";
}

const SUBJECT_TONE: Record<string, string> = {
  English: "bg-rose-500",
  Maths: "bg-indigo-500",
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
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h4>
      <ul className="space-y-2">
        {areas.map((area) => (
          <li
            key={`${area.subject}-${area.label}`}
            className="flex items-start gap-2"
          >
            <span
              className={`px-1.5 py-0.5 text-[11px] font-bold rounded border shrink-0 tabular-nums ${scoreTone(
                area.percentage
              )}`}
            >
              {area.percentage}%
            </span>
            <span className="min-w-0">
              <span className="text-sm font-medium text-gray-800">
                {area.subject} · {area.label}
              </span>
              {area.detail && (
                <span className="block text-xs text-gray-500">
                  {area.detail}
                </span>
              )}
              <span className="block text-[11px] text-gray-400">
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
  const anyTime = times.some((t) => t.monthSeconds > 0);
  const panels = [
    { title: "Strengths", areas: strengths },
    { title: "Need to work on", areas: weaknesses },
  ].filter((panel) => panel.areas.length > 0);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Time spent */}
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Time spent
      </h4>

      {!anyTime ? (
        <p className="text-sm text-gray-500 italic">
          Nothing practised this month yet.
        </p>
      ) : (
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-gray-400">
              <th className="text-left font-semibold pb-1">Subject</th>
              <th className="text-right font-semibold pb-1">Today</th>
              <th className="text-right font-semibold pb-1">This week</th>
              <th className="text-right font-semibold pb-1">This month</th>
            </tr>
          </thead>
          <tbody>
            {times.map((row) => (
              <tr key={row.subject} className="border-t border-gray-100">
                <td className="py-1.5 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        SUBJECT_TONE[row.subject] ?? "bg-gray-400"
                      }`}
                    />
                    {row.subject}
                  </span>
                </td>
                <td className="py-1.5 text-right tabular-nums text-gray-800">
                  {formatDuration(row.todaySeconds)}
                </td>
                <td className="py-1.5 text-right tabular-nums text-gray-800">
                  {formatDuration(row.weekSeconds)}
                </td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-gray-900">
                  {formatDuration(row.monthSeconds)}
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
