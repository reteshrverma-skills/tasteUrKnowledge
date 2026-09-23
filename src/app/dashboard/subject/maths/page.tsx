import Link from "next/link";
import { getSession } from "@/lib/auth";
import { scoreStyle } from "@/lib/student";
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
    : new Map<string, number[]>();

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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-800">
          {MATHS_SUBJECT_NAME}
        </h2>
        <p className="text-gray-600 mt-1 mb-6">
          Pick a difficulty, then open a topic and choose a subtopic — you will
          get up to {QUESTIONS_PER_ROUND} random questions.
        </p>

        {levels.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-800 text-lg font-medium">
              No Maths levels are open to you yet
            </p>
            <p className="text-gray-600 mt-2">
              Ask your teacher to unlock a difficulty level for you.
            </p>
          </div>
        ) : (
          <>
            {/* Difficulty selector */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Difficulty level
              </h3>
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
                      className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow"
                          : `${mathsLevelStyle(level)} hover:brightness-95`
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
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
                No topics at this level yet.
              </div>
            ) : (
              <div className="space-y-3">
                {topics.map((group, index) => {
                  const topicRecent =
                    attempts.get(topicKey(group.topic, activeLevel)) ?? [];
                  return (
                  <details
                    key={group.topic}
                    // First topic starts open so the page is never a wall of
                    // closed frames.
                    open={index === 0}
                    className="group bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200"
                  >
                    <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none hover:bg-gray-50 transition list-none [&::-webkit-details-marker]:hidden">
                      <span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
                        ▶
                      </span>
                      <span className="font-bold text-gray-800">
                        {group.topic}{" "}
                        <span className="font-normal text-gray-500">
                          ({group.count.toLocaleString()})
                        </span>
                      </span>
                      <span className="ml-auto flex items-center gap-2 shrink-0">

                        {/* Last 3 whole-topic test results */}
                        <span className="flex items-center gap-1">
                          {topicRecent.length === 0 ? (
                            <span className="text-[11px] text-gray-400 italic">
                              No test yet
                            </span>
                          ) : (
                            topicRecent.map((percentage, idx) => (
                              <span
                                key={idx}
                                className={`px-1.5 py-0.5 text-[11px] font-bold rounded border ${scoreStyle(
                                  percentage
                                )}`}
                              >
                                {percentage}%
                              </span>
                            ))
                          )}
                        </span>

                        {/* Whole-topic test across every subtopic */}
                        <Link
                          href={`/quiz/maths?topic=${encodeURIComponent(
                            group.topic
                          )}&level=${encodeURIComponent(activeLevel)}`}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition whitespace-nowrap"
                        >
                          Create test ({QUESTIONS_PER_TOPIC_TEST} Q)
                        </Link>
                      </span>
                    </summary>

                    <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                        {group.subTopics.map(({ subTopic }) => {
                          const recent =
                            attempts.get(cellKey(subTopic, activeLevel)) ?? [];
                          return (
                            <Link
                              key={subTopic}
                              href={`/quiz/maths?subTopic=${encodeURIComponent(
                                subTopic
                              )}&level=${encodeURIComponent(activeLevel)}`}
                              className="group/item flex items-center gap-2 bg-gray-50 hover:bg-white rounded-lg px-3 py-2 border-l-4 border-indigo-500 hover:shadow-sm transition"
                            >
                              <span className="text-sm font-semibold text-gray-800 group-hover/item:text-indigo-700 transition truncate">
                                {subTopic}
                              </span>

                              {/* Last 3 scores, newest first */}
                              <span className="ml-auto shrink-0 flex items-center gap-1">
                                {recent.length === 0 ? (
                                  <span className="text-[11px] text-gray-400 italic">
                                    Not attempted
                                  </span>
                                ) : (
                                  recent.map((percentage, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-1.5 py-0.5 text-[11px] font-bold rounded border ${scoreStyle(
                                        percentage
                                      )}`}
                                    >
                                      {percentage}%
                                    </span>
                                  ))
                                )}
                              </span>
                            </Link>
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
