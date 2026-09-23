import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QUESTIONS_PER_COMP_ROUND, compWhere } from "@/lib/english";
import { MATHS_SUBJECT_NAME } from "@/lib/maths";
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
}: {
  params: Promise<{ subjectName: string }>;
}) {
  // Middleware handles authentication
  const { subjectName } = await params;
  const name = decodeURIComponent(subjectName);

  // Maths is picked by difficulty + subtopic, not listed as comprehensions.
  // Matching case-insensitively so /subject/Maths lands there too.
  if (name.toLowerCase() === MATHS_SUBJECT_NAME.toLowerCase()) {
    redirect("/dashboard/subject/maths");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-indigo-600">TasteUrKnowledge</h1>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">{name}</h2>
        </div>
        <p className="text-gray-600 -mt-4 mb-8">
          Comprehensions by difficulty — each one gives you{" "}
          {QUESTIONS_PER_COMP_ROUND} random questions
        </p>

        {comps.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-800 text-lg font-medium">
              No {name} quizzes yet
            </p>
            <p className="text-gray-600 mt-2">
              {lockedCount > 0
                ? "Ask your teacher to unlock a difficulty level for you."
                : "Check back once your teacher has added some."}
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-6 bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {levels.map((level) => {
              const levelComps = byDifficulty.get(level)!;
              return (
                <div key={level}>
                  <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-300">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${difficultyStyle(
                        level
                      )}`}
                    >
                      {level}
                    </span>
                    <span className="text-xs text-gray-500">
                      {levelComps.length} comprehension
                      {levelComps.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {levelComps.map((comp) => {
                      const recent = attemptsByComp.get(comp.id) ?? [];

                      return (
                        <Link
                          key={comp.id}
                          href={`/quiz/${comp.id}`}
                          className="group flex items-center gap-3 bg-white rounded-lg shadow-sm hover:shadow-md transition px-4 py-3 border-l-4 border-green-500"
                        >
                          {/* The bracket is how many questions this round
                              asks, not how many the comprehension holds - a
                              student cares what they are about to sit. */}
                          <span className="font-semibold text-gray-800 group-hover:text-indigo-700 transition truncate">
                            {comp.label}{" "}
                            <span className="font-normal text-gray-500">
                              (
                              {Math.min(
                                QUESTIONS_PER_COMP_ROUND,
                                comp._count.questions
                              )}
                              )
                            </span>
                          </span>

                          {/* Last three attempts, newest first, right aligned */}
                          <span className="ml-auto flex items-center gap-1.5 shrink-0">
                            {recent.length === 0 ? (
                              <span className="text-xs text-gray-400 italic">
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
                                    className={`px-2 py-0.5 text-xs font-bold rounded border ${scoreStyle(
                                      attempt.percentage
                                    )}`}
                                  >
                                    {attempt.percentage}%
                                  </span>
                                )
                              )
                            )}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
