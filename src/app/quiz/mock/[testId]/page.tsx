import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitiseFigure } from "@/lib/nvr";
import { SUBJECT_LABEL, formatLondon } from "@/lib/mock-test";
import { canSitMock, hasMockAccess, phaseOf, serverNow, syncRun } from "@/lib/mock-run";
import { MockRunner, type RunnerView } from "./MockRunner";

/**
 * A Grammar School student sitting a mock test, full screen. The server
 * brings the sitting up to date with the clock (syncRun) on every load, then
 * sends only what the current screen needs; answers are never sent while a
 * section is running.
 */
export default async function MockTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { testId } = await params;
  if (!/^\d{1,18}$/.test(testId)) notFound();
  const id = BigInt(testId);

  const paper = await prisma.mockTestGs.findUnique({ where: { id }, select: { programmeCode: true, approvedByAdmin: true } });
  if (!paper || !paper.approvedByAdmin) notFound();
  if (!canSitMock(session, paper) || !(await hasMockAccess(id, session.userId))) redirect("/dashboard");

  const run = await syncRun(id, session.userId);
  if (!run) notFound();
  const phase = phaseOf(run);

  const counts = await prisma.mockTestGsQuestion.groupBy({
    by: ["setNo", "subject"],
    where: { testId: id },
    _count: { _all: true },
  });
  const countOf = (setNo: number, subject: string) =>
    counts.find((c) => c.setNo === setNo && c.subject === subject)?._count._all ?? 0;
  const label = (subject: string) => SUBJECT_LABEL[subject] ?? subject;

  const sections = run.paper.sections.map((s) => {
    const attempt = run.attempts.find((a) => a.setNo === s.setNo);
    const sa = attempt?.sections.find((x) => x.sectionId === s.id);
    return {
      id: String(s.id),
      setNo: s.setNo,
      label: label(s.subject),
      minutes: s.durationMinutes,
      questions: countOf(s.setNo, s.subject),
      status: !sa ? "waiting" : sa.endedAt ? "done" : "running",
      correct: sa?.correct ?? null,
      total: sa?.total ?? null,
    } as const;
  });

  let view: RunnerView;
  if (phase.kind === "section") {
    const section = run.paper.sections.find((s) => s.id === phase.sectionId)!;
    const [questions, saved, comp] = await Promise.all([
      prisma.mockTestGsQuestion.findMany({
        where: { testId: id, setNo: section.setNo, subject: section.subject },
        orderBy: { questionOrder: "asc" },
      }),
      prisma.mockTestResult.findMany({
        where: { sectionAttemptId: phase.sectionAttemptId },
        select: { questionId: true, chosenOption: true },
      }),
      section.subject === "ENGLISH"
        ? prisma.mockTestGsComp.findUnique({ where: { testId_setNo: { testId: id, setNo: section.setNo } } })
        : null,
    ]);
    view = {
      kind: "section",
      setNo: section.setNo,
      sectionLabel: label(section.subject),
      endsAt: phase.endsAt.getTime(),
      passage: comp ? { title: comp.label ?? "", story: comp.compStory } : null,
      questions: questions.map((q) => ({
        id: String(q.id),
        order: q.questionOrder,
        quest: q.quest,
        stem: q.stemFigure ? sanitiseFigure(q.stemFigure) : null,
        optionFormat: q.optionFormat,
        options: (["A", "B", "C", "D", "E"] as const)
          .filter((l) => q[`option${l}`])
          .map((l) => ({
            letter: l,
            value: q.optionFormat === "text" ? q[`option${l}`]! : sanitiseFigure(q[`option${l}`]),
          })),
      })),
      answers: Object.fromEntries(
        saved.filter((r) => r.chosenOption).map((r) => [String(r.questionId), r.chosenOption!.trim()])
      ),
    };
  } else if (phase.kind === "between") {
    const next = run.paper.sections.find((s) => s.id === phase.nextSectionId)!;
    view = {
      kind: "between",
      setNo: next.setNo,
      next: { label: label(next.subject), minutes: next.durationMinutes, questions: countOf(next.setNo, next.subject) },
    };
  } else if (phase.kind === "break") {
    view = { kind: "break", breakEnds: phase.breakEnds.getTime() };
  } else if (phase.kind === "finished") {
    view = {
      kind: "finished",
      marks: run.final!.marksObtained,
      total: run.final!.totalMarks,
      sets: run.attempts.map((a) => ({ setNo: a.setNo, marks: a.marksObtained ?? 0, total: a.totalMarks ?? 0, reason: a.completionReason })),
    };
  } else if (phase.kind === "upcoming") {
    view = { kind: "upcoming", opensAt: formatLondon(phase.opensAt) };
  } else {
    view = { kind: phase.kind };
  }

  return (
    <MockRunner
      testId={testId}
      name={run.paper.name}
      closesAt={formatLondon(run.closesAt)}
      closesAtMs={run.closesAt.getTime()}
      breakMinutes={run.paper.breakMinutes}
      serverNow={serverNow()}
      sections={sections}
      view={view}
    />
  );
}
