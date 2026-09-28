import { prisma } from "@/lib/prisma";
export { allowedLevels, canAccessLevel } from "@/lib/student";

export const MATHS_SUBJECT_NAME = "Maths";

/** How many questions a subtopic round serves, when enough exist. */
export const QUESTIONS_PER_ROUND = 9;

/** A whole-topic test is longer: it draws across every subtopic in the topic. */
export const QUESTIONS_PER_TOPIC_TEST = 12;

/**
 * One ladder across every subject, so a parent reading a Maths report and an
 * English report sees the same words. Anything an author adds beyond these is
 * appended rather than dropped.
 */
export const MATHS_DIFFICULTY_ORDER = [
  "Starter",
  "Explorer",
  "Navigator",
  "Challenger",
  "Master",
] as const;

export function sortMathsLevels(levels: string[]): string[] {
  const known = MATHS_DIFFICULTY_ORDER.map((d) => d.toLowerCase());
  const rank = (level: string) => {
    const i = known.indexOf(level.toLowerCase());
    return i === -1 ? known.length : i;
  };
  return [...levels].sort((a, b) => {
    const diff = rank(a) - rank(b);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}

/**
 * Colour per rung.
 *
 * Maths and English share one ladder, so they share one set of colours -
 * this used to be a second copy of the same switch, and the two drifted the
 * moment a rung was added to only one of them.
 */
export { difficultyStyle as mathsLevelStyle } from "@/lib/level-style";

/** The fields a student may see - ansChoice and explanation are withheld. */
export const mathsQuestionPublicSelect = {
  id: true,
  topic: true,
  subTopic: true,
  quest: true,
  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,
  optionE: true,
  difficultyLevel: true,
} as const;

export interface SubTopicCount {
  subTopic: string;
  count: number;
}

export interface TopicGroup {
  topic: string;
  subTopics: SubTopicCount[];
  /** Total questions across this topic at the chosen difficulty. */
  count: number;
}

/** Questions with no topic set still need somewhere to live. */
export const UNGROUPED_TOPIC = "Other";

/** Subtopics available at one difficulty, with how many questions each holds. */
export async function subTopicsForLevel(
  level: string
): Promise<SubTopicCount[]> {
  const rows = await prisma.gsMathsQuestion.groupBy({
    by: ["subTopic"],
    where: { difficultyLevel: { equals: level, mode: "insensitive" } },
    _count: { _all: true },
  });

  return rows
    .filter((row): row is typeof row & { subTopic: string } =>
      Boolean(row.subTopic)
    )
    .map((row) => ({ subTopic: row.subTopic, count: row._count._all }))
    .sort((a, b) => a.subTopic.localeCompare(b.subTopic));
}

/**
 * Subtopics at one difficulty, grouped under their topic so the picker can
 * show one collapsible frame per topic.
 */
export async function topicsForLevel(level: string): Promise<TopicGroup[]> {
  const rows = await prisma.gsMathsQuestion.groupBy({
    by: ["topic", "subTopic"],
    where: { difficultyLevel: { equals: level, mode: "insensitive" } },
    _count: { _all: true },
  });

  const byTopic = new Map<string, SubTopicCount[]>();
  for (const row of rows) {
    if (!row.subTopic) continue;
    const topic = row.topic?.trim() || UNGROUPED_TOPIC;
    const bucket = byTopic.get(topic) ?? [];
    bucket.push({ subTopic: row.subTopic, count: row._count._all });
    byTopic.set(topic, bucket);
  }

  return Array.from(byTopic.entries())
    .map(([topic, subTopics]) => ({
      topic,
      subTopics: subTopics.sort((a, b) => a.subTopic.localeCompare(b.subTopic)),
      count: subTopics.reduce((total, s) => total + s.count, 0),
    }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

/** Every difficulty that actually has questions behind it. */
export async function availableMathsLevels(): Promise<string[]> {
  const rows = await prisma.gsMathsQuestion.groupBy({
    by: ["difficultyLevel"],
    _count: { _all: true },
  });

  return sortMathsLevels(
    rows
      .map((row) => row.difficultyLevel)
      .filter((level): level is string => Boolean(level))
  );
}

/**
 * Up to `QUESTIONS_PER_ROUND` questions drawn at random from one
 * subtopic/difficulty cell.
 *
 * Postgres has no `ORDER BY random()` through the Prisma query API, so the
 * matching ids are fetched and shuffled here. The cells are small (tens of
 * rows), so this stays cheap.
 */
export async function randomQuestionIds(
  subTopic: string,
  level: string,
  take: number = QUESTIONS_PER_ROUND
): Promise<number[]> {
  const rows = await prisma.gsMathsQuestion.findMany({
    where: {
      subTopic: { equals: subTopic, mode: "insensitive" },
      difficultyLevel: { equals: level, mode: "insensitive" },
    },
    select: { id: true },
  });

  const ids = rows.map((row) => row.id);

  // Fisher-Yates: every ordering equally likely, unlike sort(() => 0.5 - rnd).
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  return ids.slice(0, take);
}

/**
 * Up to `take` questions drawn at random from every subtopic in a topic.
 * Same shuffle as the subtopic draw, over a wider pool.
 */
export async function randomQuestionIdsForTopic(
  topic: string,
  level: string,
  take: number = QUESTIONS_PER_TOPIC_TEST
): Promise<number[]> {
  const rows = await prisma.gsMathsQuestion.findMany({
    where: {
      topic: { equals: topic, mode: "insensitive" },
      difficultyLevel: { equals: level, mode: "insensitive" },
    },
    select: { id: true },
  });

  const ids = rows.map((row) => row.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, take);
}

/** Key for the per-cell attempt map: one subtopic at one difficulty. */
export function cellKey(subTopic: string, level: string): string {
  return `${subTopic.toLowerCase()}|${level.toLowerCase()}`;
}

/** Key for a whole-topic test: the topic at one difficulty. */
export function topicKey(topic: string, level: string): string {
  return `topic:${topic.toLowerCase()}|${level.toLowerCase()}`;
}

/**
 * The student's three most recent scores, newest first, keyed by what the round
 * was: `cellKey` for a subtopic round, `topicKey` for a whole-topic test.
 *
 * Reads the snapshot columns on the round rather than inferring from the
 * questions, so re-tagging a question cannot move a past result.
 */
export async function recentMathsAttempts(
  studentId: number,
  maxTests = 300
): Promise<Map<string, number[]>> {
  const tests = await prisma.testTrackerMathMain.findMany({
    where: { studentId },
    orderBy: { testStartTime: "desc" },
    take: maxTests,
    select: {
      topic: true,
      subTopic: true,
      difficultyLevel: true,
      questions: { select: { isAnsRight: true } },
    },
  });

  const byKey = new Map<string, number[]>();

  for (const test of tests) {
    if (test.questions.length === 0 || !test.difficultyLevel) continue;

    const key = test.subTopic
      ? cellKey(test.subTopic, test.difficultyLevel)
      : test.topic
      ? topicKey(test.topic, test.difficultyLevel)
      : null;
    if (!key) continue;

    const bucket = byKey.get(key) ?? [];
    // Rounds arrive newest-first, so the first three seen are the ones wanted.
    if (bucket.length >= 3) continue;

    const correct = test.questions.filter((q) => q.isAnsRight).length;
    bucket.push(Math.round((correct / test.questions.length) * 100));
    byKey.set(key, bucket);
  }

  return byKey;
}
