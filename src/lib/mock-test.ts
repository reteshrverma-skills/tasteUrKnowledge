import { prisma } from "@/lib/prisma";

/**
 * Grammar School mock tests (migration 050): dates, readiness checks and the
 * admin's view of a paper. A paper has 2 sets, each with English (one passage,
 * 15-20 questions), Maths and Verbal (20 each), and Non-Verbal (24 questions,
 * sat as 3 parts of 8, each part its own timed section; migration 058).
 */

export const MOCK_SUBJECTS = ["ENGLISH", "MATHS", "VERBAL", "NON_VERBAL"] as const;
export type MockSubject = (typeof MOCK_SUBJECTS)[number];
export const MOCK_SETS = [1, 2] as const;

export const SUBJECT_LABEL: Record<string, string> = {
  ENGLISH: "English",
  MATHS: "Maths",
  VERBAL: "Verbal Reasoning",
  NON_VERBAL: "Non-Verbal Reasoning",
};

/** Non-Verbal is sat in this many parts, each with NVR_PART_SIZE questions. */
export const NVR_PARTS = 3;
export const NVR_PART_SIZE = 8;

/** How many parts (timed sections) a subject is sat in. */
export function partsOf(subject: string): number {
  return subject === "NON_VERBAL" ? NVR_PARTS : 1;
}

/** "Non-Verbal Reasoning · Part 2", or just the subject when it has one part. */
export function sectionLabel(subject: string, part = 1): string {
  const name = SUBJECT_LABEL[subject] ?? subject;
  return partsOf(subject) > 1 ? `${name} · Part ${part}` : name;
}

/** How many questions a subject must have (across all its parts) before the paper can be approved. */
export function questionRange(subject: string): [number, number] {
  if (subject === "ENGLISH") return [15, 20];
  if (subject === "NON_VERBAL") return [NVR_PARTS * NVR_PART_SIZE, NVR_PARTS * NVR_PART_SIZE];
  return [20, 20];
}

const TIME_ZONE = "Europe/London";

/** Minutes London is ahead of UTC at the given instant (0 in winter, 60 in summer). */
function londonOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

/** "YYYY-MM-DD" of a DATE column (stored as UTC midnight). */
export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * When the paper opens and closes: 00:00 London on testDate, and 23:59:59
 * London on the last of its availableDays.
 */
export function paperWindow(testDate: Date, availableDays: number): { opensAt: Date; closesAt: Date; lastDay: string } {
  const [y, m, d] = dateKey(testDate).split("-").map(Number);
  const local = (day: number, h: number, min: number, s: number) => {
    const guess = new Date(Date.UTC(y, m - 1, day, h, min, s));
    return new Date(guess.getTime() - londonOffsetMinutes(guess) * 60000);
  };
  const lastDay = new Date(Date.UTC(y, m - 1, d + availableDays - 1));
  return {
    opensAt: local(d, 0, 0, 0),
    closesAt: local(d + availableDays - 1, 23, 59, 59),
    lastDay: dateKey(lastDay),
  };
}

/** Where a paper is in its life, for the admin list. */
export function paperState(approved: boolean, opensAt: Date, closesAt: Date): { text: string; cls: string } {
  const now = Date.now();
  if (!approved) return { text: "Not approved", cls: "bg-warm-tint text-warm" };
  if (closesAt.getTime() < now) return { text: "Closed", cls: "bg-ground text-ink-soft" };
  if (opensAt.getTime() > now) return { text: "Approved · opens soon", cls: "bg-brand-tint text-brand" };
  return { text: "Open now", cls: "bg-good-tint text-good" };
}

/** e.g. "Fri 20 Nov 2026, 23:59" in London time. */
export function formatLondon(at: Date): string {
  return at.toLocaleString("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** A paper as a student sees it on their home page. */
export interface StudentMockPaper {
  id: string;
  name: string;
  stage: string | null;
  opensAt: Date;
  closesAt: Date;
  /** "upcoming" | "open" | "closed" */
  window: "upcoming" | "open" | "closed";
  setMinutes: [number, number];
  breakMinutes: number;
  questionCount: number;
  /** "not_started" | "set1_in_progress" | "set1_done" | "set2_in_progress" | "finished" */
  progress: "not_started" | "set1_in_progress" | "set1_done" | "set2_in_progress" | "finished";
  result: { marks: number; total: number } | null;
}

/**
 * Approved papers for the student's programme that an admin has given them
 * access to (migration 053) and that are open, opening soon, or already sat.
 * Closed papers the student never started are left out.
 */
export async function studentMockPapers(studentId: number, programmeCode: string): Promise<StudentMockPaper[]> {
  const papers = await prisma.mockTestGs.findMany({
    where: {
      programmeCode,
      approvedByAdmin: true,
      access: { some: { studentId, revokedAt: null } },
    },
    orderBy: [{ testDate: "asc" }, { id: "asc" }],
    include: {
      sections: { select: { setNo: true, durationMinutes: true } },
      attempts: { where: { studentId }, select: { setNo: true, completionReason: true } },
      finalResults: { where: { studentId }, select: { marksObtained: true, totalMarks: true } },
    },
  });
  const counts = await prisma.mockTestGsQuestion.groupBy({
    by: ["testId"],
    where: { testId: { in: papers.map((p) => p.id) } },
    _count: { _all: true },
  });
  const now = Date.now();

  return papers.flatMap((p) => {
    const { opensAt, closesAt } = paperWindow(p.testDate, p.availableDays);
    const window = opensAt.getTime() > now ? "upcoming" : closesAt.getTime() < now ? "closed" : "open";
    const set = (n: number) => p.attempts.find((a) => a.setNo === n);
    const final = p.finalResults[0];
    const progress: StudentMockPaper["progress"] = final
      ? "finished"
      : set(2)
        ? set(2)!.completionReason ? "finished" : "set2_in_progress"
        : set(1)
          ? set(1)!.completionReason ? "set1_done" : "set1_in_progress"
          : "not_started";
    if (window === "closed" && progress === "not_started") return [];
    const minutes = (n: number) => p.sections.filter((s) => s.setNo === n).reduce((t, s) => t + s.durationMinutes, 0);
    return [{
      id: String(p.id),
      name: p.name,
      stage: p.stage,
      opensAt,
      closesAt,
      window,
      setMinutes: [minutes(1), minutes(2)] as [number, number],
      breakMinutes: p.breakMinutes,
      questionCount: counts.find((c) => c.testId === p.id)?._count._all ?? 0,
      progress,
      result: final ? { marks: final.marksObtained, total: final.totalMarks } : null,
    }];
  });
}

/** The paper with everything the admin page shows. */
export async function loadPaper(testId: bigint) {
  return prisma.mockTestGs.findUnique({
    where: { id: testId },
    include: {
      sections: { orderBy: [{ setNo: "asc" }, { sectionOrder: "asc" }] },
      comps: { orderBy: { setNo: "asc" } },
      _count: { select: { attempts: true } },
    },
  });
}

export type Paper = NonNullable<Awaited<ReturnType<typeof loadPaper>>>;

/** Question counts and order numbers per set and subject. */
async function questionStats(testId: bigint) {
  const rows = await prisma.mockTestGsQuestion.findMany({
    where: { testId },
    select: { setNo: true, subject: true, part: true, questionOrder: true },
  });
  const stats = new Map<string, { order: number; part: number }[]>();
  for (const r of rows) {
    const key = `${r.setNo}|${r.subject}`;
    stats.set(key, [...(stats.get(key) ?? []), { order: r.questionOrder, part: r.part }]);
  }
  return stats;
}

/**
 * Everything that stops the paper being approved; empty when it is ready.
 * The approve API runs this again, so the page can never approve a paper the
 * server would refuse.
 */
export async function paperProblems(paper: Paper): Promise<string[]> {
  const problems: string[] = [];
  const stats = await questionStats(paper.id);
  for (const setNo of MOCK_SETS) {
    for (const subject of MOCK_SUBJECTS) {
      const label = `Set ${setNo} ${SUBJECT_LABEL[subject]}`;
      const missing = Array.from({ length: partsOf(subject) }, (_, i) => i + 1).filter(
        (part) => !paper.sections.some((s) => s.setNo === setNo && s.subject === subject && s.part === part)
      );
      if (missing.length) {
        for (const part of missing) problems.push(`Set ${setNo} ${sectionLabel(subject, part)}: section is missing`);
        continue;
      }
      const rows = (stats.get(`${setNo}|${subject}`) ?? []).sort((a, b) => a.order - b.order);
      const [min, max] = questionRange(subject);
      if (rows.length < min || rows.length > max) {
        problems.push(`${label}: has ${rows.length} questions, needs ${min === max ? min : `${min}–${max}`}`);
      } else if (rows.some((r, i) => r.order !== i + 1)) {
        problems.push(`${label}: question numbers are not 1 to ${rows.length}`);
      } else if (partsOf(subject) > 1 && rows.some((r) => r.part !== Math.floor((r.order - 1) / NVR_PART_SIZE) + 1)) {
        problems.push(`${label}: each part must hold ${NVR_PART_SIZE} questions in order`);
      }
    }
    if (!paper.comps.some((c) => c.setNo === setNo)) problems.push(`Set ${setNo}: comprehension passage is missing`);
  }
  const { closesAt } = paperWindow(paper.testDate, paper.availableDays);
  if (closesAt.getTime() <= Date.now()) problems.push("The closing date has already passed: set a later opening date or more days");
  return problems;
}
