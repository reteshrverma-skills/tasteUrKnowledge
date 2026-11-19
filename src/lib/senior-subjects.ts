import config from "@/config/senior-subjects.json";
import { prisma } from "@/lib/prisma";

/**
 * Typed access to src/config/senior-subjects.json: the GCSE and A-Level
 * subjects and the awarding organisations (exam boards) offered for each.
 * A student's choices are stored in studentSubject (migration 046).
 */

export interface Board {
  code: string;
  name: string;
  specCode: string;
}

export interface SeniorSubject {
  code: string;
  name: string;
  boards: Board[];
}

/** One subject as the student has chosen it. */
export interface SubjectChoice {
  subjectCode: string;
  boardCode: string;
}

const PROGRAMMES = config as unknown as Record<string, { subjects: SeniorSubject[] } | string[]>;

/** The subjects offered for a programme; empty for one not in the config. */
export function subjectsFor(programme: string): SeniorSubject[] {
  const entry = PROGRAMMES[programme];
  return entry && !Array.isArray(entry) ? entry.subjects : [];
}

/**
 * Checks a submitted list against the config. Returns the clean choices, or an
 * error message. Each subject at most once; every board must belong to it.
 */
export function validChoices(
  programme: string,
  value: unknown
): { choices: SubjectChoice[] } | { error: string } {
  if (!Array.isArray(value)) return { error: "No subjects sent" };
  const offered = subjectsFor(programme);
  const seen = new Set<string>();
  const choices: SubjectChoice[] = [];
  for (const item of value) {
    const subjectCode = typeof item?.subjectCode === "string" ? item.subjectCode : "";
    const boardCode = typeof item?.boardCode === "string" ? item.boardCode : "";
    const subject = offered.find((s) => s.code === subjectCode);
    if (!subject) return { error: "Unknown subject" };
    if (seen.has(subjectCode)) return { error: `${subject.name} is listed twice` };
    if (!subject.boards.some((b) => b.code === boardCode)) {
      return { error: `Choose an awarding organisation for ${subject.name}` };
    }
    seen.add(subjectCode);
    choices.push({ subjectCode, boardCode });
  }
  return { choices };
}

/** The student's current choices for their programme. */
export async function studentChoices(
  studentId: number,
  programme: string
): Promise<SubjectChoice[]> {
  const rows = await prisma.studentSubject.findMany({
    where: { studentId, programmeCode: programme, isSelected: true },
    select: { subjectCode: true, boardCode: true },
  });
  return rows;
}

/**
 * Saves the student's choices. Rows are never deleted: a subject taken off
 * is kept with isSelected = false, so the history stays.
 */
export async function saveChoices(
  studentId: number,
  programme: string,
  choices: SubjectChoice[]
): Promise<void> {
  const chosen = new Set(choices.map((c) => c.subjectCode));
  await prisma.$transaction([
    prisma.studentSubject.updateMany({
      where: {
        studentId,
        programmeCode: programme,
        isSelected: true,
        subjectCode: { notIn: [...chosen] },
      },
      data: { isSelected: false, updatedAt: new Date() },
    }),
    ...choices.map((c) =>
      prisma.studentSubject.upsert({
        where: {
          studentId_programmeCode_subjectCode: {
            studentId,
            programmeCode: programme,
            subjectCode: c.subjectCode,
          },
        },
        create: {
          studentId,
          programmeCode: programme,
          subjectCode: c.subjectCode,
          boardCode: c.boardCode,
        },
        update: { boardCode: c.boardCode, isSelected: true, updatedAt: new Date() },
      })
    ),
  ]);
}
