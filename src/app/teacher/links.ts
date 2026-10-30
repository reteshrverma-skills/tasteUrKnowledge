import type { ProgressSubject } from "@/lib/progress";
import { slugForSubject } from "@/lib/progress";

/** A pupil's performance page on the teacher's side. */
export function pupilHref(studentId: number) {
  return `/teacher/pupils/${studentId}`;
}

/** A pupil's per-subject details page on the teacher's side. */
export function pupilSubjectHref(studentId: number, subject: ProgressSubject) {
  return `/teacher/pupils/${studentId}/progress/${slugForSubject(subject)}`;
}
