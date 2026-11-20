import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/auth";
import { programmeOf } from "@/lib/programme";
import { MOCK_SETS, paperWindow } from "@/lib/mock-test";

/**
 * Running a mock test for one student (migration 050).
 *
 * The database is the clock. Every section attempt stores its deadline
 * (endsAt); sync() applies what time has done since the last request:
 * sections past their deadline are marked, finished sets are totalled, Set 2
 * starts by itself when the break runs out, and everything stops at the
 * paper's closing time. So closing the browser, losing the connection or
 * coming back tomorrow all land in the right state.
 *
 * Rules: each section has its own countdown and locks when it ends; the next
 * section starts when the student clicks Start; after Set 1 there is a break
 * the student may cut short; there are no retakes (unique indexes).
 */

/** Answers may arrive this long after a deadline (network delay). */
const GRACE_MS = 3000;

/**
 * Who may sit a paper: a student on the paper's programme. They also need a
 * grant for the paper (hasMockAccess); subscription checks will go there.
 */
export function canSitMock(session: Session | null, paper: { programmeCode: string }): session is Session {
  return session?.userType === "STUDENT" && programmeOf(session) === paper.programmeCode;
}

/** Whether the student holds an active grant for the paper (migration 053). */
export async function hasMockAccess(testId: bigint, studentId: number): Promise<boolean> {
  const grant = await prisma.mockTestAccess.findUnique({
    where: { testId_studentId: { testId, studentId } },
    select: { revokedAt: true },
  });
  return grant !== null && grant.revokedAt === null;
}

async function loadRun(testId: bigint, studentId: number) {
  const paper = await prisma.mockTestGs.findUnique({
    where: { id: testId },
    include: { sections: { orderBy: [{ setNo: "asc" }, { sectionOrder: "asc" }] } },
  });
  if (!paper) return null;
  const attempts = await prisma.mockTestAttempt.findMany({
    where: { testId, studentId },
    include: { sections: true },
    orderBy: { setNo: "asc" },
  });
  const final = await prisma.mockTestFinalResult.findUnique({
    where: { testId_studentId: { testId, studentId } },
  });
  return { paper, attempts, final, ...paperWindow(paper.testDate, paper.availableDays) };
}

type Run = NonNullable<Awaited<ReturnType<typeof loadRun>>>;

/** Starts a section's clock: its own time, cut short at the paper's closing time. */
async function startSection(run: Run, attemptId: bigint, sectionId: bigint, at: Date) {
  const section = run.paper.sections.find((s) => s.id === sectionId)!;
  const endsAt = new Date(Math.min(at.getTime() + section.durationMinutes * 60000, run.closesAt.getTime()));
  await prisma.mockTestSectionAttempt
    .create({ data: { attemptId, sectionId, startedAt: at, endsAt } })
    .catch((e) => {
      if (e?.code !== "P2002") throw e; // already started by a parallel request
    });
}

/** Starts a set and its first section at `at`. */
async function startSet(run: Run, studentId: number, setNo: number, at: Date) {
  const first = run.paper.sections.find((s) => s.setNo === setNo);
  if (!first) return;
  const attempt = await prisma.mockTestAttempt
    .create({ data: { testId: run.paper.id, studentId, setNo, startedAt: at } })
    .catch(async (e) => {
      if (e?.code !== "P2002") throw e;
      return prisma.mockTestAttempt.findUnique({
        where: { testId_studentId_setNo: { testId: run.paper.id, studentId, setNo } },
      });
    });
  if (attempt) await startSection(run, attempt.id, first.id, at);
}

/** Marks a section: unanswered questions are recorded as skipped. */
async function finishSection(
  run: Run,
  studentId: number,
  sectionAttemptId: bigint,
  sectionId: bigint,
  reason: "submitted" | "timed_out" | "paper_closed",
  endedAt: Date
) {
  const section = run.paper.sections.find((s) => s.id === sectionId)!;
  const questions = await prisma.mockTestGsQuestion.findMany({
    where: { testId: run.paper.id, setNo: section.setNo, subject: section.subject },
    select: { id: true, correctAnswer: true, questionOrder: true, typeOfQuestion: true },
  });
  await prisma.mockTestResult.createMany({
    data: questions.map((q) => ({
      sectionAttemptId,
      questionId: q.id,
      studentId: BigInt(studentId),
      chosenOption: null,
      correctOption: q.correctAnswer.trim(),
      isCorrect: false,
      isSkipped: true,
      questionOrder: q.questionOrder,
      topic: q.typeOfQuestion,
    })),
    skipDuplicates: true,
  });
  const correct = await prisma.mockTestResult.count({ where: { sectionAttemptId, isCorrect: true } });
  // endedAt: null in the filter makes this safe if two requests race.
  await prisma.mockTestSectionAttempt.updateMany({
    where: { id: sectionAttemptId, endedAt: null },
    data: { endedAt, completionReason: reason, correct, total: questions.length },
  });
}

/** Totals a set once nothing more can happen in it. */
async function finishSet(run: Run, attemptId: bigint, setNo: number, reason: "submitted" | "timed_out" | "paper_closed", at: Date) {
  const sectionIds = run.paper.sections.filter((s) => s.setNo === setNo).map((s) => s.id);
  const done = await prisma.mockTestSectionAttempt.findMany({ where: { attemptId } });
  const total = await prisma.mockTestGsQuestion.count({ where: { testId: run.paper.id, setNo } });
  const marks = done.reduce((n, s) => n + (s.correct ?? 0), 0);
  const finalReason =
    reason === "paper_closed" || done.some((s) => s.completionReason === "paper_closed")
      ? "paper_closed"
      : done.length === sectionIds.length && done.every((s) => s.completionReason === "submitted")
        ? "submitted"
        : "timed_out";
  await prisma.mockTestAttempt.updateMany({
    where: { id: attemptId, submittedAt: null },
    data: { submittedAt: at, completionReason: finalReason, marksObtained: marks, totalMarks: total },
  });
}

/**
 * Brings the student's sitting up to date with the clock. Safe to call on
 * every request; loops because one change can lead to another (a break that
 * ended long ago starts Set 2, whose first section may itself have expired).
 */
export async function syncRun(testId: bigint, studentId: number): Promise<Run | null> {
  for (let pass = 0; pass < 12; pass++) {
    const run = await loadRun(testId, studentId);
    if (!run) return null;
    const now = new Date();
    const closed = now >= run.closesAt;
    let changed = false;

    for (const attempt of run.attempts) {
      for (const sa of attempt.sections) {
        if (!sa.endedAt && sa.endsAt.getTime() <= now.getTime()) {
          const reason = sa.endsAt.getTime() >= run.closesAt.getTime() ? "paper_closed" : "timed_out";
          await finishSection(run, studentId, sa.id, sa.sectionId, reason, sa.endsAt);
          changed = true;
        }
      }
      if (attempt.submittedAt) continue;
      const setSections = run.paper.sections.filter((s) => s.setNo === attempt.setNo);
      const ended = attempt.sections.filter((s) => s.endedAt);
      const open = attempt.sections.some((s) => !s.endedAt);
      if (!changed && ended.length === setSections.length) {
        const last = new Date(Math.max(...ended.map((s) => s.endedAt!.getTime())));
        await finishSet(run, attempt.id, attempt.setNo, "submitted", last);
        changed = true;
      } else if (!changed && closed && !open) {
        await finishSet(run, attempt.id, attempt.setNo, "paper_closed", run.closesAt);
        changed = true;
      }
    }
    if (changed) continue;

    const set1 = run.attempts.find((a) => a.setNo === 1);
    const set2 = run.attempts.find((a) => a.setNo === 2);
    if (set1?.submittedAt && !set2) {
      const breakEnds = new Date(set1.submittedAt.getTime() + run.paper.breakMinutes * 60000);
      if (now >= breakEnds && breakEnds < run.closesAt) {
        await startSet(run, studentId, 2, breakEnds);
        continue;
      }
    }

    const setsDone = MOCK_SETS.every((n) => run.attempts.find((a) => a.setNo === n)?.submittedAt);
    const stoppedEarly = closed && set1?.submittedAt && (!set2 || set2.submittedAt);
    if (!run.final && (setsDone || stoppedEarly)) {
      const total = await prisma.mockTestGsQuestion.count({ where: { testId: run.paper.id } });
      const marks = run.attempts.reduce((n, a) => n + (a.marksObtained ?? 0), 0);
      const at = new Date(Math.max(...run.attempts.map((a) => a.submittedAt?.getTime() ?? 0)));
      await prisma.mockTestFinalResult
        .create({ data: { testId: run.paper.id, studentId: BigInt(studentId), marksObtained: marks, totalMarks: total, completedAt: at } })
        .catch((e) => {
          if (e?.code !== "P2002") throw e;
        });
      continue;
    }
    return run;
  }
  return loadRun(testId, studentId);
}

/** Where the student is now, for the page to draw. */
export type RunPhase =
  | { kind: "upcoming"; opensAt: Date }
  | { kind: "closed" }
  | { kind: "intro" }
  | { kind: "section"; setNo: number; sectionAttemptId: bigint; sectionId: bigint; endsAt: Date }
  | { kind: "between"; setNo: number; nextSectionId: bigint }
  | { kind: "break"; breakEnds: Date }
  | { kind: "finished" };

export function phaseOf(run: Run): RunPhase {
  const now = Date.now();
  if (run.final) return { kind: "finished" };
  if (run.attempts.length === 0) {
    if (now < run.opensAt.getTime()) return { kind: "upcoming", opensAt: run.opensAt };
    if (now >= run.closesAt.getTime()) return { kind: "closed" };
    return { kind: "intro" };
  }
  for (const attempt of run.attempts) {
    const open = attempt.sections.find((s) => !s.endedAt);
    if (open) return { kind: "section", setNo: attempt.setNo, sectionAttemptId: open.id, sectionId: open.sectionId, endsAt: open.endsAt };
    if (!attempt.submittedAt) {
      const started = new Set(attempt.sections.map((s) => s.sectionId));
      const next = run.paper.sections.find((s) => s.setNo === attempt.setNo && !started.has(s.id));
      if (next) return { kind: "between", setNo: attempt.setNo, nextSectionId: next.id };
    }
  }
  const set1 = run.attempts.find((a) => a.setNo === 1);
  if (set1?.submittedAt && !run.attempts.some((a) => a.setNo === 2)) {
    return { kind: "break", breakEnds: new Date(set1.submittedAt.getTime() + run.paper.breakMinutes * 60000) };
  }
  return { kind: "closed" };
}

/** The student's Start button: Set 1, the next section, or Set 2 early. */
export async function startNext(testId: bigint, studentId: number): Promise<string | null> {
  const run = await syncRun(testId, studentId);
  if (!run) return "Unknown mock test";
  if (Date.now() >= run.closesAt.getTime()) return "This mock test has closed";
  const phase = phaseOf(run);
  const now = new Date();
  if (phase.kind === "intro") await startSet(run, studentId, 1, now);
  else if (phase.kind === "between") {
    const attempt = run.attempts.find((a) => a.setNo === phase.setNo)!;
    await startSection(run, attempt.id, phase.nextSectionId, now);
  } else if (phase.kind === "break") await startSet(run, studentId, 2, now);
  else if (phase.kind !== "section") return "There is nothing to start";
  return null;
}

/** Saves (or changes) one answer in the section that is running. */
export async function saveAnswer(
  testId: bigint,
  studentId: number,
  questionId: bigint,
  chosen: string | null,
  seconds: number | null
): Promise<string | null> {
  const run = await syncRun(testId, studentId);
  if (!run) return "Unknown mock test";
  const phase = phaseOf(run);
  if (phase.kind !== "section") return "This section has ended";
  if (Date.now() > phase.endsAt.getTime() + GRACE_MS) return "Time is up for this section";
  const section = run.paper.sections.find((s) => s.id === phase.sectionId)!;
  const q = await prisma.mockTestGsQuestion.findFirst({
    where: { id: questionId, testId, setNo: section.setNo, subject: section.subject },
  });
  if (!q) return "That question is not in this section";
  if (chosen !== null && (!/^[A-E]$/.test(chosen) || (chosen === "E" && !q.optionE))) return "Unknown option";
  const correctOption = q.correctAnswer.trim();
  const timeSpent = seconds === null || !Number.isFinite(seconds) ? null : Math.min(Math.max(seconds, 0), 7200);
  const data = {
    chosenOption: chosen,
    correctOption,
    isCorrect: chosen === correctOption,
    isSkipped: chosen === null,
    timeSpentOnQuestion: timeSpent === null ? null : timeSpent.toFixed(2),
    questionOrder: q.questionOrder,
    topic: q.typeOfQuestion,
    answeredAt: new Date(),
  };
  await prisma.mockTestResult.upsert({
    where: { sectionAttemptId_questionId: { sectionAttemptId: phase.sectionAttemptId, questionId } },
    create: { sectionAttemptId: phase.sectionAttemptId, questionId, studentId: BigInt(studentId), ...data },
    update: data,
  });
  return null;
}

/** The student hands in the running section early. */
export async function submitSection(testId: bigint, studentId: number): Promise<string | null> {
  const run = await syncRun(testId, studentId);
  if (!run) return "Unknown mock test";
  const phase = phaseOf(run);
  if (phase.kind !== "section") return null; // already ended: nothing to do
  await finishSection(run, studentId, phase.sectionAttemptId, phase.sectionId, "submitted", new Date());
  await syncRun(testId, studentId);
  return null;
}

/** The server's clock, so the page can correct for a student's wrong clock. */
export function serverNow(): number {
  return Date.now();
}
