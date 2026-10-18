import { prisma } from "@/lib/prisma";
import { PROGRESS_SUBJECTS, type ProgressSubject } from "@/lib/progress";

/**
 * Focus topics: what a parent picked from "Focus next" for their child, shown
 * on the child's dashboard with a button that starts a round on just that.
 */

export interface FocusTopic {
  id: number;
  subject: ProgressSubject;
  label: string;
  topic: string | null;
  subTopic: string | null;
  level: string | null;
  createdAt: Date;
}

export function isProgressSubject(value: unknown): value is ProgressSubject {
  return PROGRESS_SUBJECTS.some((s) => s.subject === value);
}

/** A child's focus topics still open, newest first. */
export async function openFocusTopics(studentId: number): Promise<FocusTopic[]> {
  const rows = await prisma.studentFocus.findMany({
    where: { studentId, clearedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      subject: true,
      label: true,
      topic: true,
      subTopic: true,
      level: true,
      createdAt: true,
    },
  });

  return rows
    .filter((row) => isProgressSubject(row.subject))
    .map((row) => ({
      ...row,
      id: Number(row.id),
      subject: row.subject as ProgressSubject,
    }));
}

/**
 * Where the child's "Start" button goes.
 *
 * Maths, Verbal and Non-Verbal open their quiz on the subtopic at the level
 * last practised. English has no topic rounds of its own, so it goes through
 * /dashboard/focus/[id], which picks a comprehension rich in that question
 * type and asks only those questions.
 */
export function focusPracticeHref(focus: FocusTopic): string {
  if (focus.subject === "English") return `/dashboard/focus/${focus.id}`;

  const base =
    focus.subject === "Maths"
      ? "/quiz/maths"
      : focus.subject === "Verbal Reasoning"
        ? "/quiz/vr"
        : "/quiz/nvr";
  const picker =
    focus.subject === "Maths"
      ? "/dashboard/subject/maths"
      : focus.subject === "Verbal Reasoning"
        ? "/dashboard/subject/verbal"
        : "/dashboard/subject/non-verbal";

  // Without a level the quiz has nothing to draw from; the picker does.
  if (!focus.level || !(focus.subTopic || focus.topic)) return picker;

  const query = new URLSearchParams({ level: focus.level });
  if (focus.topic) query.set("topic", focus.topic);
  if (focus.subTopic) query.set("subTopic", focus.subTopic);
  return `${base}?${query}`;
}
