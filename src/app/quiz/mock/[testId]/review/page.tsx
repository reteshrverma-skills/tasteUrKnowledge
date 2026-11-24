import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitiseFigure, withViewBox } from "@/lib/nvr";
import { sectionLabel } from "@/lib/mock-test";
import { canSitMock, hasMockAccess, phaseOf, syncRun } from "@/lib/mock-run";
import { BrandLogo } from "@/components/BrandLogo";
import { QuestionBody } from "../QuestionBody";

type Filter = "all" | "wrong" | "skipped" | "correct";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "wrong", label: "Wrong" },
  { key: "skipped", label: "Not answered" },
  { key: "correct", label: "Correct" },
];

/** Same colours as each question's status chip. */
const FILTER_TONE: Record<Filter, string> = {
  all: "bg-brand-tint text-brand",
  wrong: "bg-poor-tint text-poor",
  skipped: "bg-warm-tint text-warm",
  correct: "bg-good-tint text-good",
};

/**
 * A finished mock test, question by question: the child's answer, the
 * correct one and the explanation, one section at a time. Only open once the
 * whole paper is finished, so answers never leak while it is still running.
 */
export default async function MockReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ s?: string; f?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { testId } = await params;
  if (!/^\d{1,18}$/.test(testId)) notFound();
  const id = BigInt(testId);

  const paper = await prisma.mockTestGs.findUnique({ where: { id }, select: { programmeCode: true, approvedByAdmin: true } });
  if (!paper || !paper.approvedByAdmin) notFound();
  if (!canSitMock(session, paper) || !(await hasMockAccess(id, session.userId))) redirect("/dashboard/mock-tests");

  const run = await syncRun(id, session.userId);
  if (!run) notFound();
  if (phaseOf(run).kind !== "finished") redirect(`/quiz/mock/${testId}`);

  const { s, f } = await searchParams;
  const filter: Filter = FILTERS.some((x) => x.key === f) ? (f as Filter) : "all";
  const sections = run.paper.sections;
  const section = sections.find((x) => String(x.id) === s) ?? sections[0];
  if (!section) notFound();

  // Answers are looked up across the whole set by question, not by section
  // attempt: papers sat before Non-Verbal was split into parts (migration 058)
  // hold all their Non-Verbal answers under the part 1 section.
  const setAttempt = run.attempts.find((a) => a.setNo === section.setNo);
  const questions = await prisma.mockTestGsQuestion.findMany({
    where: { testId: id, setNo: section.setNo, subject: section.subject, part: section.part },
    orderBy: { questionOrder: "asc" },
  });
  const [results, comp] = await Promise.all([
    setAttempt
      ? prisma.mockTestResult.findMany({
          where: { sectionAttemptId: { in: setAttempt.sections.map((x) => x.id) }, questionId: { in: questions.map((q) => q.id) } },
          select: { questionId: true, chosenOption: true, timeSpentOnQuestion: true },
        })
      : [],
    section.subject === "ENGLISH"
      ? prisma.mockTestGsComp.findUnique({ where: { testId_setNo: { testId: id, setNo: section.setNo } } })
      : null,
  ]);

  // Score per section tab, from the answers themselves (see the note above).
  const [allAnswers, allQuestions] = await Promise.all([
    prisma.mockTestResult.findMany({
      where: { sectionAttemptId: { in: run.attempts.flatMap((a) => a.sections.map((x) => x.id)) } },
      select: { questionId: true, isCorrect: true },
    }),
    prisma.mockTestGsQuestion.findMany({ where: { testId: id }, select: { id: true, setNo: true, subject: true, part: true } }),
  ]);
  const tabScore = (x: (typeof sections)[number]) => {
    const ids = new Set(allQuestions.filter((q) => q.setNo === x.setNo && q.subject === x.subject && q.part === x.part).map((q) => q.id));
    const answered = allAnswers.filter((r) => ids.has(r.questionId));
    return answered.length ? `${answered.filter((r) => r.isCorrect).length}/${ids.size}` : "—";
  };

  const rows = questions.map((q) => {
    const r = results.find((x) => x.questionId === q.id);
    const chosen = r?.chosenOption?.trim() || null;
    const correct = q.correctAnswer.trim();
    const status: Exclude<Filter, "all"> = !chosen ? "skipped" : chosen === correct ? "correct" : "wrong";
    return {
      status,
      chosen,
      correct,
      explanation: q.explanation,
      seconds: r?.timeSpentOnQuestion ? Number(r.timeSpentOnQuestion) : null,
      order: questions.indexOf(q) + 1,
      q: {
        id: String(q.id),
        quest: q.quest,
        stem: q.stemFigure ? withViewBox(sanitiseFigure(q.stemFigure)) : null,
        optionFormat: q.optionFormat,
        options: (["A", "B", "C", "D", "E"] as const)
          .filter((l) => q[`option${l}`])
          .map((l) => ({
            letter: l,
            value: q.optionFormat === "text" ? q[`option${l}`]! : withViewBox(sanitiseFigure(q[`option${l}`])),
          })),
      },
    };
  });
  const counts = {
    all: rows.length,
    correct: rows.filter((r) => r.status === "correct").length,
    wrong: rows.filter((r) => r.status === "wrong").length,
    skipped: rows.filter((r) => r.status === "skipped").length,
  };
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const href = (sectionId: bigint, f: Filter) =>
    `/quiz/mock/${testId}/review?s=${sectionId}${f === "all" ? "" : `&f=${f}`}`;

  return (
    <div className="min-h-screen bg-ground">
      <header className="sticky top-0 z-10 bg-surface border-b border-line">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo height={36} />
            <span className="font-semibold text-ink truncate">{run.paper.name} · Review</span>
          </div>
          <Link href={`/quiz/mock/${testId}`} className="text-sm font-medium text-ink-soft hover:text-brand">
            ← Results
          </Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        <nav className="grid gap-3 sm:grid-cols-2" aria-label="Sections">
          {[1, 2].map((setNo) => (
            <div key={setNo} className="card p-3">
              <p className="px-1 text-xs font-semibold tracking-wide text-login-teal">SET {setNo}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sections
                  .filter((x) => x.setNo === setNo)
                  .map((x) => {
                    const active = x.id === section.id;
                    return (
                      <Link
                        key={String(x.id)}
                        href={href(x.id, "all")}
                        aria-current={active ? "page" : undefined}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                          active ? "bg-brand text-white" : "bg-ground text-ink hover:bg-brand-tint"
                        }`}
                      >
                        {sectionLabel(x.subject, x.part)}
                        <span className={`ml-1.5 tabular text-xs ${active ? "text-white/80" : "text-ink-soft"}`}>
                          {tabScore(x)}
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-xl font-semibold text-ink">
            Set {section.setNo} · {sectionLabel(section.subject, section.part)}
            {results.length === 0 && <span className="ml-2 text-sm font-normal text-warm">Not reached</span>}
          </h1>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((x) => (
              <Link
                key={x.key}
                href={href(section.id, x.key)}
                aria-current={filter === x.key ? "page" : undefined}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${FILTER_TONE[x.key] ?? FILTER_TONE.all} ${
                  filter === x.key ? "border-current" : "border-transparent opacity-75 hover:opacity-100"
                }`}
              >
                {x.label} <span className="tabular">{counts[x.key]}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className={comp ? "grid gap-5 lg:grid-cols-2 items-start" : "max-w-3xl mx-auto"}>
          {comp && (
            <article className="card p-5 sm:p-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:sticky lg:top-20">
              <h2 className="font-display text-lg font-semibold text-ink">{comp.label}</h2>
              {comp.compStory.split("\n\n").map((p, i) => (
                <p key={i} className="mt-3 text-[15px] leading-relaxed text-ink">
                  {p}
                </p>
              ))}
            </article>
          )}
          <div className="space-y-4">
            {shown.length === 0 && <p className="card p-6 text-center text-sm text-ink-soft">No questions here.</p>}
            {shown.map((r) => (
              <section key={r.q.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold tracking-wide text-login-teal">
                    QUESTION {r.order} OF {rows.length}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    {r.seconds !== null && <span className="text-ink-soft tabular">{Math.round(r.seconds)}s</span>}
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-semibold ${
                        r.status === "correct"
                          ? "bg-good-tint text-good"
                          : r.status === "wrong"
                            ? "bg-poor-tint text-poor"
                            : "bg-warm-tint text-warm"
                      }`}
                    >
                      {r.status === "correct" ? "Correct" : r.status === "wrong" ? "Wrong" : "Not answered"}
                    </span>
                  </div>
                </div>
                <QuestionBody q={r.q} chosen={r.chosen} correct={r.correct} />
                <p className="mt-4 text-sm text-ink">
                  Your answer: <strong>{r.chosen ?? "—"}</strong> · Correct answer: <strong className="text-good">{r.correct}</strong>
                </p>
                {r.explanation && (
                  <div className="mt-3 rounded-lg bg-ground px-4 py-3 text-sm text-ink whitespace-pre-line">
                    <span className="font-semibold">Explanation: </span>
                    {r.explanation}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
