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

/** Codes used before the rename to subject names (migrations 048, 049). */
const LEGACY_CODES: Record<string, string> = { maths: "mathematics" };

/**
 * The config code for a stored or loaded subject code, ignoring case and
 * mapping old codes (MATHS -> Mathematics); null for a subject not offered.
 */
export function canonicalCode(programme: string, raw: string): string | null {
  const key = raw.trim().toLowerCase();
  const wanted = LEGACY_CODES[key] ?? key;
  return subjectsFor(programme).find((s) => s.code.toLowerCase() === wanted)?.code ?? null;
}

/** A config code and the old codes that mean the same subject, e.g. ["Mathematics", "maths"]. */
export function codeAliases(code: string): string[] {
  const key = code.toLowerCase();
  return [code, ...Object.keys(LEGACY_CODES).filter((old) => LEGACY_CODES[old] === key)];
}

/**
 * The student's current choices for their programme, with codes in the
 * config's spelling. Rows for subjects no longer offered are left out.
 */
export async function studentChoices(
  studentId: number,
  programme: string
): Promise<SubjectChoice[]> {
  const rows = await prisma.studentSubject.findMany({
    where: { studentId, programmeCode: programme, isSelected: true },
    select: { subjectCode: true, boardCode: true },
  });
  const choices = new Map<string, SubjectChoice>();
  for (const row of rows) {
    const subjectCode = canonicalCode(programme, row.subjectCode);
    // A row already in the config's spelling wins over an old-code duplicate.
    if (subjectCode && (!choices.has(subjectCode) || row.subjectCode === subjectCode)) {
      choices.set(subjectCode, { subjectCode, boardCode: row.boardCode });
    }
  }
  return [...choices.values()];
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
  // Old-code rows (e.g. MATHS) are switched off too; the config-spelt row
  // created below replaces them. Nothing is deleted.
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
