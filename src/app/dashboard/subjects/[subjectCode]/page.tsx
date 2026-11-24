import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSeniorStudent } from "@/lib/student-account";
import { codeAliases, studentChoices, subjectsFor } from "@/lib/senior-subjects";
import { scoreStyle } from "@/lib/level-style";
import { loadSeniorHome } from "../../SeniorHome";
import { ProfileCard } from "../../StudentHome";
import { formatDate, percent } from "../marks";
import { TestDateField } from "./TestDateField";
import { MarksTable } from "./MarksTable";

/**
 * One chosen subject in detail for a GCSE / A-Level student: marks by topic
 * across all their loaded tests, then each test (testLoadALevel) with its
 * question-by-question marks (testLoadALevelDetail), which the student can
 * correct.
 */
export default async function SeniorSubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectCode: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSeniorStudent(session)) redirect("/dashboard/subjects");

  const { subjectCode } = await params;
  const wanted = decodeURIComponent(subjectCode).toLowerCase();
  const subject = subjectsFor(session.programme).find((s) => s.code.toLowerCase() === wanted);
  // An old or mistyped link (e.g. /MATHS from before the rename) goes back to the list.
  if (!subject) redirect("/dashboard/subjects");
  const code = subject.code;

  const [{ card }, choices, tests] = await Promise.all([
    loadSeniorHome(session),
    studentChoices(session.userId, session.programme),
    prisma.testLoadALevel.findMany({
      where: {
        studentId: session.userId,
        OR: codeAliases(code).map((c) => ({ subject: { equals: c, mode: "insensitive" as const } })),
      },
      orderBy: [{ testDate: "desc" }, { uploadDate: "desc" }],
      select: {
        id: true,
        testName: true,
        board: true,
        awardedMarks: true,
        totalMarks: true,
        testDate: true,
        uploadDate: true,
        details: {
          orderBy: [{ qNumber: "asc" }, { subQuestionNo: "asc" }],
          select: {
            id: true,
            qNumber: true,
            subQuestionNo: true,
            topic: true,
            subtopic: true,
            awardedMarks: true,
            totalMarks: true,
          },
        },
      },
    }),
  ]);
  const choice = choices.find((c) => c.subjectCode === code);
  const board = subject.boards.find((b) => b.code === choice?.boardCode);
  const boardName = (c: string) => subject.boards.find((b) => b.code === c)?.name ?? c;

  // Marks by topic across every test, weakest first.
  const byTopic = new Map<string, { awarded: number; total: number; questions: number }>();
  for (const test of tests) {
    for (const d of test.details) {
      const key = d.topic?.trim() || "Other";
      const row = byTopic.get(key) ?? { awarded: 0, total: 0, questions: 0 };
      row.awarded += d.awardedMarks;
      row.total += d.totalMarks;
      row.questions += 1;
      byTopic.set(key, row);
    }
  }
  const topics = [...byTopic.entries()]
    .map(([topic, r]) => ({ topic, ...r, pct: percent(r.awarded, r.total) }))
    .sort((a, b) => a.pct - b.pct || a.topic.localeCompare(b.topic));

  const awarded = tests.reduce((n, t) => n + t.awardedMarks, 0);
  const total = tests.reduce((n, t) => n + t.totalMarks, 0);

  return (
    <div className="min-h-screen bg-ground">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 items-start">
        {/* Left: profile card with marks by topic under it. */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <ProfileCard {...card} className="" />
          {topics.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-ink">By topic</h3>
              <p className="mt-0.5 text-xs text-ink-soft">All your tests together, weakest topic first.</p>
              <ul className="mt-3 space-y-3">
                {topics.map((t) => (
                  <li key={t.topic}>
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="text-ink min-w-0">{t.topic}</span>
                      <span className="text-ink-soft tabular shrink-0">{t.pct}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-ground overflow-hidden">
                      <div
                        className={`h-full rounded-full border ${scoreStyle(t.pct)}`}
                        style={{ width: `${Math.max(t.pct, 2)}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-ink-faint tabular">
                      {t.awarded}/{t.total} marks
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <section className="space-y-4 min-w-0">
          <Link href="/dashboard/subjects" className="text-sm font-medium text-brand hover:underline">
            ← All subjects
          </Link>

          <div className="card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold text-ink">{subject.name}</h2>
              {board && (
                <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand">
                  {board.name} · {board.specCode}
                </span>
              )}
              {!choice && (
                <span className="rounded-full bg-warm-tint px-2 py-0.5 text-xs font-medium text-warm">
                  Not on your subject list
                </span>
              )}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <Stat label="Tests" value={String(tests.length)} />
              <Stat label="Marks" value={total ? `${awarded} / ${total}` : "-"} />
              <Stat label="Overall" value={total ? `${percent(awarded, total)}%` : "-"} />
            </dl>
          </div>

          {tests.length === 0 ? (
            <div className="card p-5 text-sm text-ink-soft">
              No tests have been loaded for {subject.name} yet. Once your test papers are marked
              and loaded, your scores and topic breakdown will show here.
            </div>
          ) : (
            <>
              <h3 className="pt-1 text-sm font-semibold text-ink-soft">Tests</h3>
              {tests.map((test, i) => {
                const pct = percent(test.awardedMarks, test.totalMarks);
                return (
                  <details key={String(test.id)} className="card group" open={i === 0}>
                    <summary className="cursor-pointer list-none p-4 sm:p-5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-ink">{test.testName}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium tabular ${scoreStyle(pct)}`}>
                        {test.awardedMarks}/{test.totalMarks} · {pct}%
                      </span>
                      <span className="text-xs text-ink-faint">
                        {test.testDate ? formatDate(test.testDate) : "No date - open to add one"} ·{" "}
                        {boardName(test.board)}
                      </span>
                      <span className="ml-auto text-xs font-medium text-brand">
                        <span className="group-open:hidden">Show questions</span>
                        <span className="hidden group-open:inline">Hide questions</span>
                      </span>
                    </summary>
                    <div className="border-t border-line px-4 sm:px-5 py-3">
                      <TestDateField
                        testId={String(test.id)}
                        value={test.testDate ? test.testDate.toISOString().slice(0, 10) : ""}
                      />
                    </div>
                    <div className="border-t border-line px-4 sm:px-5 py-3 overflow-x-auto">
                      {test.details.length === 0 ? (
                        <p className="text-sm text-ink-soft">No question breakdown for this test.</p>
                      ) : (
                        <MarksTable
                          testId={String(test.id)}
                          rows={test.details.map((d) => ({
                            id: String(d.id),
                            question: `${d.qNumber}${d.subQuestionNo ? ` ${d.subQuestionNo}` : ""}`,
                            topic: d.topic,
                            subtopic: d.subtopic,
                            awardedMarks: d.awardedMarks,
                            totalMarks: d.totalMarks,
                          }))}
                        />
                      )}
                    </div>
                  </details>
                );
              })}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ground px-3 py-2">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="font-semibold text-ink tabular">{value}</dd>
    </div>
  );
}
