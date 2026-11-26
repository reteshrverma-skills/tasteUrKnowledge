import Link from "next/link";
import { levelButtonStyle } from "@/lib/level-style";
import { LevelLabel } from "../LevelIcon";
import { getSession } from "@/lib/auth";
import { programmeOf } from "@/lib/programme";
import { scoreStyle, type TestScore } from "@/lib/student";
import {
  QUESTIONS_PER_VR_ROUND,
  QUESTIONS_PER_VR_TOPIC_TEST,
  VR_SUBJECT_FULL,
  allowedLevels,
  availableVrLevels,
  canAccessLevel,
  recentVrAttempts,
  vrCellKey,
  vrLevelStyle,
  vrTopicKey,
  vrTopicsForLevel,
} from "@/lib/vr";
import { WithProfileCard } from "../../ProfileColumn";
import { SubjectHeader } from "../../StudentHome";

/**
 * Verbal Reasoning picker, the same shape as Maths: choose a difficulty at the top, then open a topic to
 * pick a subtopic. The chosen combination starts a round of random questions.
 *
 * The selected level lives in the query string rather than client state, so
 * this stays a server component and each level is a shareable link. The topic
 * frames are <details> elements, which collapse without any client JavaScript.
 */
export default async function VerbalPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level: requestedLevel } = await searchParams;

  const session = await getSession();
  // Only this programme's content: Grammar School, GCSE or A-Level.
  const programme = programmeOf(session);

  // The student's recent scores need nothing else, so they load alongside
  // the rest rather than after it.
  const attemptsPromise = session
    ? recentVrAttempts(session.userId)
    : Promise.resolve(new Map<string, TestScore[]>());

  // Only levels that have questions AND that this student is allowed to open.
  const [access, bankLevels] = await Promise.all([
    allowedLevels(session),
    availableVrLevels(programme),
  ]);
  const levels = bankLevels.filter((level) => canAccessLevel(access, level));

  // Fall back to the easiest unlocked rung when the query string is missing,
  // bogus, or names a level this student may not open.
  const activeLevel =
    levels.find((l) => l.toLowerCase() === requestedLevel?.toLowerCase()) ??
    levels[0];

  const [topics, attempts] = await Promise.all([
    activeLevel ? vrTopicsForLevel(programme, activeLevel) : [],
    attemptsPromise,
  ]);

  return (
    <div className="min-h-screen bg-ground">

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        <WithProfileCard subject={"Verbal"}>
        <SubjectHeader title={VR_SUBJECT_FULL} level={activeLevel}>
            Pick a difficulty, open a topic, choose a subtopic — you get up to{" "}
            {QUESTIONS_PER_VR_ROUND} random questions.
          </SubjectHeader>

        {levels.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              No levels are open to you yet
            </p>
            <p className="text-ink-soft text-sm mt-1.5">
              Ask your teacher to unlock a stage for you.
            </p>
          </div>
        ) : (
          <>
            {/* Difficulty selector */}
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
                      href={`/dashboard/subject/verbal?level=${encodeURIComponent(
                        level
                      )}`}
                      aria-current={isActive ? "true" : undefined}
                      className={`chip chip-lg border transition inline-flex items-center gap-1.5 ${
                        isActive
                          ? "bg-brand text-white border-brand shadow-sm"
                          : `${vrLevelStyle(level)} hover:brightness-[0.97]`
                      }`}
                    >
                      <LevelLabel level={level} />
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
                    attempts.get(vrTopicKey(group.topic, activeLevel)) ?? [];
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
                                href={`/dashboard/subject/verbal/review/${testId}`}
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
                          href={`/quiz/vr?topic=${encodeURIComponent(
                            group.topic
                          )}&level=${encodeURIComponent(activeLevel)}`}
                          className="btn-primary px-3 py-1.5 text-xs whitespace-nowrap"
                        >
                          Mixed practice · {QUESTIONS_PER_VR_TOPIC_TEST} Q
                        </Link>
                      </span>
                    </summary>

                    <div className="px-4 pb-4 pt-1 border-t border-line">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 mt-3">
                        {group.subTopics.map(({ subTopic }) => {
                          const recent =
                            attempts.get(vrCellKey(group.topic, subTopic, activeLevel)) ?? [];
                          return (
                            // A div, not a Link: the score chips are links of
                            // their own and anchors cannot nest. The subtopic
                            // link is stretched over the card instead.
                            <div
                              key={subTopic}
                              className="group/item relative flex items-stretch gap-2 bg-ground hover:bg-surface rounded-lg px-3 py-2.5 border border-transparent hover:border-line-strong transition"
                            >
                              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                              <Link
                                href={`/quiz/vr?topic=${encodeURIComponent(
                                  group.topic
                                )}&subTopic=${encodeURIComponent(
                                  subTopic
                                )}&level=${encodeURIComponent(activeLevel)}`}
                                className="text-sm font-medium text-ink group-hover/item:text-brand transition truncate after:absolute after:inset-0 after:rounded-lg"
                              >
                                {subTopic}
                              </Link>

                              {/* Last 3 scores, newest first */}
                              <span className="relative z-10 flex flex-wrap items-center gap-1 empty:hidden">
                                {recent.map(({ testId, percentage }) => (
                                  <Link
                                    key={testId}
                                    href={`/dashboard/subject/verbal/review/${testId}`}
                                    title="Review this test"
                                    className={`chip ${scoreStyle(
                                      percentage
                                    )} hover:brightness-95 transition`}
                                  >
                                    {percentage}%
                                  </Link>
                                ))}
                              </span>
                              </div>

                              {/* Looks like a button; the click lands on the
                                  stretched subtopic link underneath. */}
                              <span
                                aria-hidden="true"
                                className={`btn-primary shrink-0 self-stretch flex items-center px-3 text-xs whitespace-nowrap ${levelButtonStyle(activeLevel)}`}
                              >
                                Practise
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
        </WithProfileCard>
      </div>
    </div>
  );
}
