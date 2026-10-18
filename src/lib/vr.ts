import { prisma } from "@/lib/prisma";
import { cachedUntilFlush } from "@/lib/bank-cache";
import { normaliseOption } from "@/lib/tracker";
import { sortDifficulties, type TestScore } from "@/lib/student";
export { allowedLevels, canAccessLevel } from "@/lib/student";
export { difficultyStyle as vrLevelStyle } from "@/lib/level-style";

/**
 * Verbal Reasoning: standalone MCQs picked by difficulty, topic and subtopic,
 * the same shape as Maths.
 *
 * The VR tables use BIGINT ids, which Prisma reads as BigInt. BigInt cannot go
 * through JSON, so ids are turned into numbers on the way out of this module
 * and back into BigInt on the way in. Ids this size are far inside the range
 * a JS number holds exactly.
 */

/** The name on the subject tile, matched case-insensitively. */
export const VR_SUBJECT_NAME = "Verbal";
export const VR_SUBJECT_FULL = "Verbal Reasoning";

/** How many questions a subtopic round serves, when enough exist. */
export const QUESTIONS_PER_VR_ROUND = 9;

/** A whole-topic test draws across every subtopic in the topic. */
export const QUESTIONS_PER_VR_TOPIC_TEST = 12;

/** Questions with no topic set still need somewhere to live. */
const UNGROUPED_TOPIC = "Other";

export function isVrSubject(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n === VR_SUBJECT_NAME.toLowerCase() || n === VR_SUBJECT_FULL.toLowerCase();
}

/** Accepts only BigInt-safe whole numbers from a browser. */
export function toVrId(value: unknown): bigint | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? BigInt(value)
    : null;
}

/** The fields a student may see - the answer and explanations are withheld. */
const publicSelect = {
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

export interface VrSubTopicCount {
  subTopic: string;
  count: number;
}

export interface VrTopicGroup {
  topic: string;
  subTopics: VrSubTopicCount[];
  /** Total questions across this topic at the chosen difficulty. */
  count: number;
}

/** Every difficulty on the ladder that actually has questions behind it. */
export const availableVrLevels = cachedUntilFlush(
  "vr-levels",
  async (): Promise<string[]> => {
    const rows = await prisma.gsVrQuestion.groupBy({
      by: ["difficultyLevel"],
      _count: { _all: true },
    });
    return sortDifficulties(rows.map((row) => row.difficultyLevel));
  }
);

/** Subtopics at one difficulty, grouped under their topic. */
export const vrTopicsForLevel = cachedUntilFlush(
  "vr-topics",
  async (level: string): Promise<VrTopicGroup[]> => {
    const rows = await prisma.gsVrQuestion.groupBy({
      by: ["topic", "subTopic"],
      where: { difficultyLevel: { equals: level, mode: "insensitive" } },
      _count: { _all: true },
    });

    const byTopic = new Map<string, VrSubTopicCount[]>();
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
);

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  // Fisher-Yates: every ordering equally likely.
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A random round: one subtopic of one topic, or - with no subtopic - a wider
 * test across every subtopic of the topic. Returned in the shuffled order,
 * ids as numbers.
 */
export async function randomVrRound(
  level: string,
  topic: string | null,
  subTopic: string | null
) {
  const take = subTopic ? QUESTIONS_PER_VR_ROUND : QUESTIONS_PER_VR_TOPIC_TEST;
  const rows = await prisma.gsVrQuestion.findMany({
    where: {
      difficultyLevel: { equals: level, mode: "insensitive" },
      ...(subTopic
        ? { subTopic: { equals: subTopic, mode: "insensitive" } }
        : {}),
      // Subtopic names repeat across topics, so the topic keeps the draw
      // inside the frame the student opened.
      ...(topic ? { topic: { equals: topic, mode: "insensitive" } } : {}),
    },
    select: { id: true },
  });

  const ids = shuffled(rows.map((row) => row.id)).slice(0, take);
  if (ids.length === 0) return [];

  const questions = await prisma.gsVrQuestion.findMany({
    where: { id: { in: ids } },
    select: publicSelect,
  });
  const byId = new Map(questions.map((q) => [q.id, q]));
  return ids
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((q) => ({ ...q, id: Number(q.id) }));
}

/** The answer and explanations for graded questions, keyed by numeric id. */
export async function vrAnswerKey(ids: bigint[]) {
  const rows = await prisma.gsVrQuestion.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      quest: true,
      subTopic: true,
      ansChoice: true,
      explanation: true,
      whyWrongA: true,
      whyWrongB: true,
      whyWrongC: true,
      whyWrongD: true,
      whyWrongE: true,
    },
  });
  return new Map(
    rows.map((q) => [
      Number(q.id),
      { ...q, id: Number(q.id), ansChoice: normaliseOption(q.ansChoice) },
    ])
  );
}

/** Why `option` is wrong for this question, when the bank says. */
export function whyWrong(
  q: Partial<Record<`whyWrong${"A" | "B" | "C" | "D" | "E"}`, string | null>>,
  option: string | null
): string | null {
  const letter = normaliseOption(option);
  if (!letter) return null;
  return q[`whyWrong${letter as "A" | "B" | "C" | "D" | "E"}`]?.trim() || null;
}

/** Key for the per-cell attempt map: one subtopic of one topic at one level. */
export function vrCellKey(topic: string, subTopic: string, level: string): string {
  return `${topic.toLowerCase()}|${subTopic.toLowerCase()}|${level.toLowerCase()}`;
}

/** Key for a whole-topic test: the topic at one difficulty. */
export function vrTopicKey(topic: string, level: string): string {
  return `topic:${topic.toLowerCase()}|${level.toLowerCase()}`;
}

/** The student's three most recent scores per cell and per topic, newest first. */
export async function recentVrAttempts(
  studentId: number,
  maxTests = 300
): Promise<Map<string, TestScore[]>> {
  const tests = await prisma.testTrackerVrMain.findMany({
    where: { studentId: BigInt(studentId) },
    orderBy: { testStartTime: "desc" },
    take: maxTests,
    select: {
      id: true,
      topic: true,
      subTopic: true,
      difficultyLevel: true,
      questions: { select: { isAnsRight: true } },
    },
  });

  const byKey = new Map<string, TestScore[]>();
  for (const test of tests) {
    if (test.questions.length === 0 || !test.difficultyLevel || !test.topic) {
      continue;
    }
    const key = test.subTopic
      ? vrCellKey(test.topic, test.subTopic, test.difficultyLevel)
      : vrTopicKey(test.topic, test.difficultyLevel);

    const bucket = byKey.get(key) ?? [];
    // Rounds arrive newest-first, so the first three seen are the ones wanted.
    if (bucket.length >= 3) continue;

    const correct = test.questions.filter((q) => q.isAnsRight).length;
    bucket.push({
      testId: Number(test.id),
      percentage: Math.round((correct / test.questions.length) * 100),
    });
    byKey.set(key, bucket);
  }
  return byKey;
}

/**
 * One past round with every question, the answer given and the right answer,
 * in the order presented. Scoped to the student, so a guessed id cannot open
 * someone else's test.
 */
export async function vrTestReview(testId: number, studentId: number) {
  return prisma.testTrackerVrMain.findFirst({
    where: { id: BigInt(testId), studentId: BigInt(studentId) },
    select: {
      testStartTime: true,
      topic: true,
      subTopic: true,
      difficultyLevel: true,
      completionReason: true,
      questions: {
        orderBy: [{ questionOrder: "asc" }, { id: "asc" }],
        select: {
          id: true,
          isAnsRight: true,
          chosenOption: true,
          correctOption: true,
          flaggedUnclear: true,
          question: {
            select: {
              quest: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
              optionE: true,
              ansChoice: true,
              explanation: true,
              whyWrongA: true,
              whyWrongB: true,
              whyWrongC: true,
              whyWrongD: true,
              whyWrongE: true,
            },
          },
        },
      },
    },
  });
}
