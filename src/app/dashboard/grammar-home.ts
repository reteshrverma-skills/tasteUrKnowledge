import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/auth";
import { programmeOf } from "@/lib/programme";
import { APPROVED_COMP, SUBJECT_ORDER, displayName } from "@/lib/english";
import { MATHS_SUBJECT_NAME } from "@/lib/maths";
import { NVR_SUBJECT_NAME } from "@/lib/nvr";
import { isVrSubject } from "@/lib/vr";
import { pupilSchoolFor } from "@/lib/school-logo";
import { openFocusTopics, type FocusTopic } from "@/lib/focus";

export interface ProfileCardData {
  name: string;
  subtitle: string;
  userId: string;
  stats: { label: string; value: string }[];
}

/**
 * Everything the Grammar School home shows: the profile card, the subjects
 * with their counts, and the parent's focus topics. Shared with the subject
 * pages, which show the same profile card. cache() so one request reads it once.
 */
export const loadGrammarHome = cache(async (session: Session | null) => {
  // Counts only this programme's content.
  const programme = programmeOf(session);

  // Independent reads, so they go to the database together rather than
  // one after another.
  const [
    profile,
    subjectRows,
    compCounts,
    mathsCount,
    nvrCount,
    vrCount,
    focusTopics,
    pupilSchool,
  ] = await Promise.all([
    session
      ? prisma.userProfile.findUnique({
          where: { id: session.userId },
          select: { fName: true, mName: true, lName: true, profileName: true },
        })
      : null,
    // Subjects come from the Subject table, but the four canonical ones are
    // always shown so a student never lands on an empty page.
    prisma.subject.findMany({
      select: { name: true },
      distinct: ["name"],
      orderBy: { order: "asc" },
    }),
    // Comprehensions are no longer filed by year - difficulty level alone
    // decides what a student may open - so every comprehension counts here.
    prisma.gsEnglishComp.groupBy({
      by: ["subjectName"],
      // Counts only what a student can open.
      where: { ...APPROVED_COMP, programmeCode: programme },
      _count: { _all: true },
    }),
    // Maths, Non-Verbal and Verbal each live in their own table, counted as
    // questions rather than comprehensions. A subject missing from here
    // reads as "Coming soon" however much content it actually has.
    prisma.gsMathsQuestion.count({ where: { programmeCode: programme } }),
    prisma.gsNvrQuestion.count({ where: { programmeCode: programme } }),
    prisma.gsVrQuestion.count({ where: { programmeCode: programme } }),
    // What a parent has asked this child to work on.
    session?.userType === "STUDENT"
      ? openFocusTopics(session.userId)
      : Promise.resolve([] as FocusTopic[]),
    pupilSchoolFor(session),
  ]);

  const studentName = profile ? displayName(profile) : "Student";

  const subjectNames = Array.from(
    new Set([...SUBJECT_ORDER, ...subjectRows.map((s) => s.name)])
  );

  const subjects = subjectNames.map((name) => {
    const lower = name.toLowerCase();
    // Maths, Verbal and Non-Verbal are banks of individual questions;
    // English is a shelf of comprehensions.
    const countsQuestions =
      lower === MATHS_SUBJECT_NAME.toLowerCase() ||
      lower === NVR_SUBJECT_NAME.toLowerCase() ||
      isVrSubject(name);
    const count =
      lower === MATHS_SUBJECT_NAME.toLowerCase()
        ? mathsCount
        : lower === NVR_SUBJECT_NAME.toLowerCase()
        ? nvrCount
        : isVrSubject(name)
        ? vrCount
        : compCounts.find((row) => row.subjectName?.toLowerCase() === lower)?._count._all ?? 0;
    return { name, count, countsQuestions };
  });

  const questionTotal = subjects
    .filter((s) => s.countsQuestions)
    .reduce((sum, s) => sum + s.count, 0);
  const comprehensionTotal = subjects
    .filter((s) => !s.countsQuestions)
    .reduce((sum, s) => sum + s.count, 0);
  const openCount = subjects.filter((s) => s.count > 0).length;

  const card: ProfileCardData = {
    name: pupilSchool?.person ?? studentName,
    subtitle: pupilSchool ? pupilSchool.schoolName : "Grammar School 11+ student",
    userId: profile?.profileName ?? session?.profileName ?? "",
    stats: [
      { label: "Subjects open", value: `${openCount} of ${subjects.length}` },
      { label: "Questions", value: questionTotal.toLocaleString() },
      { label: "Comprehensions", value: comprehensionTotal.toLocaleString() },
      { label: "Focus topics", value: String(focusTopics.length) },
    ],
  };

  return {
    card,
    firstName: profile?.fName?.trim() || studentName,
    subjects,
    focusTopics,
  };
});
