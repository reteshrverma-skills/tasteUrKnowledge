import Link from "next/link";
import { getSession } from "@/lib/auth";
import { scoreStyle, type TestScore } from "@/lib/student";
import {
  MATHS_SUBJECT_NAME,
  QUESTIONS_PER_ROUND,
  QUESTIONS_PER_TOPIC_TEST,
  allowedLevels,
  availableMathsLevels,
  canAccessLevel,
  cellKey,
  mathsLevelStyle,
  recentMathsAttempts,
  topicKey,
  topicsForLevel,
} from "@/lib/maths";

/**
 * Maths practice picker: choose a difficulty at the top, then open a topic to
 * pick a subtopic. The chosen combination starts a round of random questions.
 *
 * The selected level lives in the query string rather than client state, so
 * this stays a server component and each level is a shareable link. The topic
 * frames are <details> elements, which collapse without any client JavaScript.
 */
export default async function MathsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level: requestedLevel } = await searchParams;

  const session = await getSession();

  // Only levels that have questions AND that this student is allowed to open.
  const access = await allowedLevels(session);
  const levels = (await availableMathsLevels()).filter((level) =>
    canAccessLevel(access, level)
  );

  // Fall back to the easiest unlocked rung when the query string is missing,
  // bogus, or names a level this student may not open.
  const activeLevel =
    levels.find((l) => l.toLowerCase() === requestedLevel?.toLowerCase()) ??
    levels[0];

  const topics = activeLevel ? await topicsForLevel(activeLevel) : [];

  const attempts = session
    ? await recentMathsAttempts(session.userId)
    : new Map<string, TestScore[]>();

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3.5 flex justify-between items-center gap-4">
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

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <header className="mb-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">
            {MATHS_SUBJECT_NAME}
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            Pick a difficulty, open a topic, choose a subtopic — you get up to{" "}
            {QUESTIONS_PER_ROUND} random questions.
          </p>
        </header>

        {levels.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              No levels are open to you yet
            </p>
            <p className="text-ink-soft text-sm mt-1.5">
              Ask your teacher to unlock a difficulty level for you.
            </p>
          </div>
        ) : (
          <>
            {/* Difficulty selector */}
            <div className="mb-7">
              <h2 className="eyebrow mb-2.5">Difficulty level</h2>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => {
                  const isActive = level === activeLevel;
                  return (
                    <Link
                      key={level}
                      href={`/dashboard/subject/maths?level=${encodeURIComponent(
                        level
                      )}`}
                      aria-current={isActive ? "true" : undefined}
                      className={`chip chip-lg border transition ${
                        isActive
                          ? "bg-brand text-white border-brand shadow-sm"
                          : `${mathsLevelStyle(level)} hover:brightness-[0.97]`
                      }`}
                    >
                      {level}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* One collapsible frame per topic, subtopics inside */}
            {topics.length === 0 ? (
              <div className="card p-10 text-center text-ink-soft text-sm">
                No topics at this level yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {topics.map((group, index) => {
                  const topicRecent =
                    attempts.get(topicKey(group.topic, activeLevel)) ?? [];
                  return (
                  <details
                    key={group.topic}
                    // First topic starts open so the page is never a wall of
                    // closed frames.
                    open={index === 0}
                    className="group card overflow-hidden"
                  >
                    <summary className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none hover:bg-ground/60 transition list-none [&::-webkit-details-marker]:hidden">
                      <span className="text-ink-faint text-[10px] transition-transform group-open:rotate-90">
                        ▶
                      </span>
                      <span className="font-display font-semibold text-ink">
                        {group.topic}{" "}
                        <span className="font-sans font-normal text-sm text-ink-faint tabular">
                          {group.count.toLocaleString()}
                        </span>
                      </span>
                      <span className="ml-auto flex items-center gap-2.5 shrink-0">
                        {/* Last 3 whole-topic test results */}
                        <span className="hidden sm:flex items-center gap-1">
                          {topicRecent.length === 0 ? (
                            <span className="text-[11px] text-ink-faint">
                              No test yet
                            </span>
                          ) : (
                            topicRecent.map(({ testId, percentage }) => (
                              <Link
                                key={testId}
                                href={`/dashboard/subject/maths/review/${testId}`}
                                title="Review this test"
                                className={`chip ${scoreStyle(
                                  percentage
                                )} hover:brightness-95 transition`}
                              >
                                {percentage}%
                              </Link>
                            ))
                          )}
                        </span>

                        {/* Whole-topic test across every subtopic */}
                        <Link
                          href={`/quiz/maths?topic=${encodeURIComponent(
                            group.topic
                          )}&level=${encodeURIComponent(activeLevel)}`}
                          className="btn-primary px-3 py-1.5 text-xs whitespace-nowrap"
                        >
                          Create test · {QUESTIONS_PER_TOPIC_TEST} Q
                        </Link>
                      </span>
                    </summary>

                    <div className="px-4 pb-4 pt-1 border-t border-line">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                        {group.subTopics.map(({ subTopic }) => {
                          const recent =
                            attempts.get(cellKey(subTopic, activeLevel)) ?? [];
                          return (
                            // A div, not a Link: the score chips are links of
                            // their own and anchors cannot nest. The subtopic
                            // link is stretched over the card instead.
                            <div
                              key={subTopic}
                              className="group/item relative flex items-center gap-2 bg-ground hover:bg-surface rounded-lg px-3 py-2.5 border border-transparent hover:border-line-strong transition"
                            >
                              <Link
                                href={`/quiz/maths?subTopic=${encodeURIComponent(
                                  subTopic
                                )}&level=${encodeURIComponent(activeLevel)}`}
                                className="text-sm font-medium text-ink group-hover/item:text-brand transition truncate after:absolute after:inset-0 after:rounded-lg"
                              >
                                {subTopic}
                              </Link>

                              {/* Last 3 scores, newest first */}
                              <span className="relative z-10 ml-auto shrink-0 flex items-center gap-1">
                                {recent.length === 0 ? (
                                  <span className="text-[11px] text-ink-faint">
                                    —
                                  </span>
                                ) : (
                                  recent.map(({ testId, percentage }) => (
                                    <Link
                                      key={testId}
                                      href={`/dashboard/subject/maths/review/${testId}`}
                                      title="Review this test"
                                      className={`chip ${scoreStyle(
                                        percentage
                                      )} hover:brightness-95 transition`}
                                    >
                                      {percentage}%
                                    </Link>
                                  ))
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </details>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
