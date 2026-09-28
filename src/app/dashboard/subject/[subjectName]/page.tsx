import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QUESTIONS_PER_COMP_ROUND, compWhere } from "@/lib/english";
import { MATHS_SUBJECT_NAME } from "@/lib/maths";
import { NVR_SUBJECT_NAME } from "@/lib/nvr";
import {
  UNGRADED_LABEL,
  allowedLevels,
  canAccessLevel,
  difficultyStyle,
  recentAttemptsByComp,
  scoreStyle,
  sortDifficulties,
} from "@/lib/student";

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

  const session = await getSession();

  // Difficulty levels this student may open, shared with Maths.
  const access = await allowedLevels(session);

  const allComps = await prisma.gsEnglishComp.findMany({
    where: compWhere(null, name),
    select: {
      id: true,
      label: true,
      difficultyLevel: true,
      _count: { select: { questions: true } },
    },
    orderBy: { id: "asc" },
  });

  // A level the student has not been granted is not listed at all.
  const comps = allComps.filter((comp) =>
    canAccessLevel(access, comp.difficultyLevel)
  );

  const lockedCount = allComps.length - comps.length;

  const attemptsByComp = session
    ? await recentAttemptsByComp(
        session.userId,
        comps.map((c) => c.id)
      )
    : new Map();

  // Band by difficulty, treating blank as one "Unrated" group.
  const byDifficulty = new Map<string, typeof comps>();
  for (const comp of comps) {
    const level = comp.difficultyLevel?.trim() || UNGRADED_LABEL;
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
      <nav className="bg-surface border-b border-line">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-3.5 flex justify-between items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-ink-soft hover:text-brand transition"
          >
            ← Subjects
          </Link>
          <span className="font-display text-lg font-bold text-brand">
            TasteUrKnowledge
          </span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">{name}</h1>
          <p className="text-ink-soft text-sm mt-1">
            Each comprehension gives you {QUESTIONS_PER_COMP_ROUND} random
            questions, so it is worth coming back to.
          </p>
        </header>

        {comps.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              Nothing here yet
            </p>
            <p className="text-ink-soft text-sm mt-1.5 max-w-sm mx-auto">
              {lockedCount > 0
                ? "Ask your teacher to unlock a difficulty level for you."
                : "Check back once your teacher has added some."}
            </p>
            <Link href="/dashboard" className="btn-primary inline-block mt-6 px-5 py-2.5">
              Back to subjects
            </Link>
          </div>
        ) : (
          <>
            {/* Same difficulty selector as Maths and Non-Verbal */}
            <div className="mb-7">
              <h2 className="eyebrow mb-2.5">Difficulty level</h2>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => {
                  const isActive = level === activeLevel;
                  return (
                    <Link
                      key={level}
                      href={`/dashboard/subject/${encodeURIComponent(
                        name
                      )}?level=${encodeURIComponent(level)}`}
                      aria-current={isActive ? "true" : undefined}
                      className={`chip chip-lg border transition ${
                        isActive
                          ? "bg-brand text-white border-brand shadow-sm"
                          : `${difficultyStyle(level)} hover:brightness-[0.97]`
                      }`}
                    >
                      {level}
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

                  <div className="space-y-2">
                    {levelComps.map((comp) => {
                      const recent = attemptsByComp.get(comp.id) ?? [];

                      return (
                        <Link
                          key={comp.id}
                          href={`/quiz/${comp.id}`}
                          className="card-quiet group flex items-center gap-3 px-4 py-3.5 transition hover:border-brand/40 hover:shadow-sm"
                        >
                          {/* The bracket is how many questions this round
                              asks, not how many the comprehension holds - a
                              student cares what they are about to sit. */}
                          <span className="font-medium text-ink group-hover:text-brand transition truncate">
                            {comp.label}
                            <span className="text-ink-faint font-normal tabular">
                              {" · "}
                              {Math.min(
                                QUESTIONS_PER_COMP_ROUND,
                                comp._count.questions
                              )}{" "}
                              questions
                            </span>
                          </span>

                          {/* Last three attempts, newest first, right aligned */}
                          <span className="ml-auto flex items-center gap-1.5 shrink-0">
                            {recent.length === 0 ? (
                              <span className="text-xs text-ink-faint">
                                Not attempted
                              </span>
                            ) : (
                              recent.map(
                                (
                                  attempt: {
                                    percentage: number;
                                    submittedAt: Date;
                                  },
                                  idx: number
                                ) => (
                                  <span
                                    key={idx}
                                    title={`${new Date(
                                      attempt.submittedAt
                                    ).toLocaleDateString()} - ${attempt.percentage}%`}
                                    className={`chip ${scoreStyle(
                                      attempt.percentage
                                    )}`}
                                  >
                                    {attempt.percentage}%
                                  </span>
                                )
                              )
                            )}
                            <span
                              aria-hidden="true"
                              className="text-ink-faint transition-transform group-hover:translate-x-0.5"
                            >
                              →
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
