import { prisma } from "@/lib/prisma";
import { levelButtonStyle } from "@/lib/level-style";
import { getSession } from "@/lib/auth";
import { programmeOf } from "@/lib/programme";
import Link from "next/link";
import { LevelLabel } from "../LevelIcon";
import { redirect } from "next/navigation";
import {
  COMP_NEWEST_FIRST,
  APPROVED_COMP,
  QUESTIONS_PER_COMP_ROUND,
  compWhere,
} from "@/lib/english";
import { MATHS_SUBJECT_NAME } from "@/lib/maths";
import { NVR_SUBJECT_NAME } from "@/lib/nvr";
import { isVrSubject } from "@/lib/vr";
import {
  type RecentAttempt,
  allowedLevels,
  canAccessLevel,
  canonicalLevel,
  difficultyStyle,
  recentAttemptsByComp,
  scoreStyle,
  sortDifficulties,
} from "@/lib/student";
import { WithProfileCard } from "../../ProfileColumn";
import { SubjectHeader } from "../../StudentHome";

/**
 * One subject's comprehensions, banded by difficulty. Each card carries the
 * student's last three scores at it.
 *
 * Difficulty is the only gate: a comprehension is shown when the student has
 * been granted its level. School year no longer narrows the list.
 */
export default async function SubjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectName: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  // Middleware handles authentication
  const { subjectName } = await params;
  const { level: requestedLevel } = await searchParams;
  const name = decodeURIComponent(subjectName);

  // Maths and Non-Verbal are picked by difficulty + subtopic rather than
  // listed as comprehensions, so each has its own screen. Matched
  // case-insensitively so /subject/Maths lands there too.
  if (name.toLowerCase() === MATHS_SUBJECT_NAME.toLowerCase()) {
    redirect("/dashboard/subject/maths");
  }
  if (name.toLowerCase() === NVR_SUBJECT_NAME.toLowerCase()) {
    redirect("/dashboard/subject/non-verbal");
  }
  // Verbal Reasoning is a question bank like Maths, not comprehensions.
  if (isVrSubject(name)) {
    redirect("/dashboard/subject/verbal");
  }

  const session = await getSession();

  // Difficulty levels this student may open (shared with Maths), and the
  // subject's passages: independent, so fetched together.
  const [access, allComps] = await Promise.all([
    allowedLevels(session),
    prisma.gsEnglishComp.findMany({
      // Only passages an admin has approved are listed.
      where: {
        ...compWhere(null, name),
        ...APPROVED_COMP,
        // Only this child's programme: Grammar School, GCSE or A-Level.
        programmeCode: programmeOf(session),
      },
      select: {
        id: true,
        label: true,
        stage: true,
        _count: { select: { questions: true } },
      },
      orderBy: [...COMP_NEWEST_FIRST],
    }),
  ]);

  // Only comprehensions on the ladder, and only at levels the student has
  // been granted.
  const comps = allComps.filter(
    (comp) =>
      canonicalLevel(comp.stage) &&
      canAccessLevel(access, comp.stage)
  );

  const lockedCount = allComps.length - comps.length;

  const attemptsByComp = session
    ? await recentAttemptsByComp(
        session.userId,
        comps.map((c) => Number(c.id))
      )
    : new Map<number, RecentAttempt[]>();

  // Band by difficulty.
  const byDifficulty = new Map<string, typeof comps>();
  for (const comp of comps) {
    const level = canonicalLevel(comp.stage)!;
    const bucket = byDifficulty.get(level);
    if (bucket) {
      bucket.push(comp);
    } else {
      byDifficulty.set(level, [comp]);
    }
  }

  const levels = sortDifficulties(Array.from(byDifficulty.keys()));

  // One difficulty at a time, chosen by chips at the top - the same control
  // Maths and Non-Verbal use. The level lives in the query string rather than
  // client state, so this stays a server component and each level is a
  // shareable link.
  const activeLevel =
    levels.find((l) => l.toLowerCase() === requestedLevel?.toLowerCase()) ??
    levels[0];
  const activeComps = activeLevel ? byDifficulty.get(activeLevel) ?? [] : [];

  return (
    <div className="min-h-screen bg-ground">

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        <WithProfileCard subject={name}>
        <SubjectHeader title={name} level={activeLevel}>
            Each comprehension gives you {QUESTIONS_PER_COMP_ROUND} random
            questions, so it is worth coming back to.
          </SubjectHeader>

        {comps.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              Nothing here yet
            </p>
            <p className="text-ink-soft text-sm mt-1.5 max-w-sm mx-auto">
              {lockedCount > 0
                ? "Ask your teacher to unlock a stage for you."
                : "Check back once your teacher has added some."}
            </p>
            <Link href="/dashboard" className="btn-primary inline-block mt-6 px-5 py-2.5">
              Back to subjects
            </Link>
          </div>
        ) : (
          <>
            {/* Same difficulty selector as Maths and Non-Verbal */}
            {/* Back to Home on the left; the stages stay centred (the empty
                third column balances the first). */}
            <div className="mb-6 flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
              <Link
                href="/dashboard"
                className="self-start md:justify-self-start btn-quiet px-3.5 py-2 text-sm"
              >
                ← Home
              </Link>
              <div className="flex flex-wrap justify-center gap-2" aria-label="Stage">
                {levels.map((level) => {
                  const isActive = level === activeLevel;
                  return (
                    <Link
                      key={level}
                      href={`/dashboard/subject/${encodeURIComponent(
                        name
                      )}?level=${encodeURIComponent(level)}`}
                      aria-current={isActive ? "true" : undefined}
                      className={`chip chip-lg border transition inline-flex items-center gap-1.5 ${
                        isActive
                          ? "bg-brand text-white border-brand shadow-sm"
                          : `${difficultyStyle(level)} hover:brightness-[0.97]`
                      }`}
                    >
                      <LevelLabel level={level} />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-8">
              {[activeLevel].filter(Boolean).map((level) => {
                const levelComps = byDifficulty.get(level)!;
                return (
                  <section key={level}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="text-xs text-ink-faint tabular">
                        {levelComps.length} comprehension
                        {levelComps.length === 1 ? "" : "s"} at {level}
                      </span>
                      <span
                        className="flex-1 h-px bg-line"
                        aria-hidden="true"
                      />
                    </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2">
                    {levelComps.map((comp) => {
                      const recent = attemptsByComp.get(Number(comp.id)) ?? [];

                      return (
                        // A div, not a Link: the score chips are links of
                        // their own and anchors cannot nest. The quiz link is
                        // stretched over the card instead.
                        <div
                          key={comp.id}
                          className="card-quiet group relative flex items-stretch gap-2 px-3 py-2.5 transition hover:border-brand/40 hover:shadow-sm"
                        >
                          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                          {/* Styled like a Maths topic heading: the title in
                              the display face, then how many questions the
                              comprehension holds (each round draws from these). */}
                          <Link
                            href={`/quiz/${comp.id}`}
                            className="font-display font-semibold text-ink group-hover:text-brand transition truncate after:absolute after:inset-0"
                          >
                            {comp.label}{" "}
                            <span className="font-sans font-normal text-sm text-ink-faint tabular">
                              {comp._count.questions.toLocaleString()}
                            </span>
                          </Link>

                          {/* Last three attempts, newest first, under the title */}
                          <span className="relative z-10 flex flex-wrap items-center gap-1 empty:hidden">
                            {recent.map((attempt) => (
                                <Link
                                  key={attempt.testId}
                                  href={`/dashboard/subject/${encodeURIComponent(
                                    name
                                  )}/review/${attempt.testId}`}
                                  title={`Review the test from ${new Date(
                                    attempt.submittedAt
                                  ).toLocaleDateString()}`}
                                  className={`relative z-10 chip ${scoreStyle(
                                    attempt.percentage
                                  )} hover:brightness-95 transition`}
                                >
                                  {attempt.percentage}%
                                </Link>
                              ))}
                          </span>
                          </div>
                          {/* Looks like a button; the click lands on the
                              stretched quiz link underneath. */}
                          <span
                            aria-hidden="true"
                            className={`btn-primary shrink-0 self-stretch flex items-center px-3 text-xs whitespace-nowrap ${levelButtonStyle(
                              level
                            )}`}
                          >
                            Practise
                          </span>
                        </div>
                      );
                    })}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
        </WithProfileCard>
      </div>
    </div>
  );
}
