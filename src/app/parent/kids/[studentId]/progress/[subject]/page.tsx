import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { ownsChild, parentProfile } from "@/lib/parent";
import {
  MIN_ATTEMPTED,
  STRONG_THRESHOLD,
  formatDuration,
  subjectDetail,
  subjectForSlug,
  timeSpentBySubject,
} from "@/lib/progress";
import { difficultyStyle, scoreStyle } from "@/lib/level-style";
import { ParentNav } from "../../../../ParentNav";
import { SUBJECT_HEADING, SUBJECT_TONE } from "../../../../ChildProgress";

function formatDay(date: Date | null) {
  return date
    ? date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    : "—";
}

/**
 * One child's progress in one subject, opened from a Details button on the
 * parent dashboard: time spent, every topic's score (not just the top three)
 * and their latest tests.
 */
export default async function SubjectProgressPage({
  params,
}: {
  params: Promise<{ studentId: string; subject: string }>;
}) {
  const session = await getSession();
  if (!session || session.userType !== "PARENT") redirect("/login");

  const { studentId: raw, subject: slug } = await params;
  const studentId = Number(raw);
  const subject = subjectForSlug(slug);

  // A child belonging to someone else is simply not there for this parent.
  if (!subject || !Number.isInteger(studentId)) notFound();
  if (!(await ownsChild(session.userId, studentId))) notFound();

  const [child, profile, times, detail] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: studentId },
      select: { fName: true, mName: true, lName: true, profileName: true },
    }),
    parentProfile(session.userId),
    timeSpentBySubject(studentId),
    subjectDetail(studentId, subject),
  ]);
  if (!child) notFound();

  const time = times.find((t) => t.subject === subject);
  const childName = displayName(child);

  return (
    <div className="min-h-screen bg-ground">
      <ParentNav parentName={profile ? displayName(profile) : "Parent"} />

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-5">
        <Link
          href="/parent"
          className="text-sm font-medium text-ink-soft hover:text-brand transition"
        >
          ← Back to dashboard
        </Link>

        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink inline-flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${SUBJECT_TONE[subject]}`}
            />
            {subject}
          </h1>
          <p className="text-ink-soft text-sm mt-1">{childName}</p>
        </header>

        {/* Time spent */}
        <section className="card p-5 sm:p-6">
          <h2 className="eyebrow mb-3">Time spent</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ["Today", time?.todaySeconds ?? 0],
              ["This week", time?.weekSeconds ?? 0],
              ["This month", time?.monthSeconds ?? 0],
              ["All time", time?.allTimeSeconds ?? 0],
            ].map(([label, seconds]) => (
              <div key={label as string}>
                <dt className="text-xs text-ink-faint">{label}</dt>
                <dd className="font-display text-xl font-semibold text-ink tabular mt-0.5">
                  {formatDuration(seconds as number)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Every topic */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-ink">
            {SUBJECT_HEADING[subject]}
          </h2>
          <p className="text-xs text-ink-faint mt-1">
            Green is {STRONG_THRESHOLD}% and above. Topics with fewer than{" "}
            {MIN_ATTEMPTED} answers are shown but not yet counted as a
            strength or a weakness on the dashboard.
          </p>

          {detail.areas.length === 0 ? (
            <p className="text-sm text-ink-faint mt-4">
              No {subject} questions answered yet.
            </p>
          ) : (
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="eyebrow">
                  <th className="text-left pb-1.5 font-semibold">Topic</th>
                  <th className="text-right pb-1.5 font-semibold">Answered</th>
                  <th className="text-right pb-1.5 font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {detail.areas.map((area) => (
                  <tr key={area.label} className="border-t border-line">
                    <td className="py-2 pr-3 text-ink">
                      {area.label}
                      {area.attempted < MIN_ATTEMPTED && (
                        <span className="text-ink-faint text-xs">
                          {" "}
                          · too few to judge
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular text-ink-soft">
                      {area.attempted}
                    </td>
                    <td className="py-2 text-right">
                      <span className={`chip ${scoreStyle(area.percentage)}`}>
                        {area.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Latest tests */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-ink">
            Latest tests
          </h2>

          {detail.tests.length === 0 ? (
            <p className="text-sm text-ink-faint mt-4">No tests taken yet.</p>
          ) : (
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="eyebrow">
                  <th className="text-left pb-1.5 font-semibold">Date</th>
                  <th className="text-left pb-1.5 font-semibold">Test</th>
                  <th className="text-left pb-1.5 font-semibold hidden sm:table-cell">
                    Level
                  </th>
                  <th className="text-right pb-1.5 font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {detail.tests.map((test) => (
                  <tr key={test.id} className="border-t border-line">
                    <td className="py-2 pr-3 text-ink-soft whitespace-nowrap tabular">
                      {formatDay(test.startedAt)}
                    </td>
                    <td className="py-2 pr-3 text-ink">{test.label}</td>
                    <td className="py-2 pr-3 hidden sm:table-cell">
                      {test.level && (
                        <span className={`chip ${difficultyStyle(test.level)}`}>
                          {test.level}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <span className="text-xs text-ink-faint tabular mr-2">
                        {test.correct}/{test.total}
                      </span>
                      <span className={`chip ${scoreStyle(test.percentage)}`}>
                        {test.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
