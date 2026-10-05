import { prisma } from "@/lib/prisma";
import { sortDifficulties } from "@/lib/student";

import type { TestScore } from "@/lib/student";
export { allowedLevels, canAccessLevel } from "@/lib/student";
export { difficultyStyle as nvrLevelStyle } from "@/lib/level-style";

/**
 * The subject as the dashboard tile spells it, and as the question bank
 * spells it. They differ, so both live here rather than being guessed at the
 * call site.
 */
export const NVR_SUBJECT_NAME = "Non-Verbal";
export const NVR_SUBJECT_FULL = "Non-Verbal Reasoning";

/** Questions in one round, matching Maths. */
export const QUESTIONS_PER_NVR_ROUND = 9;

/** A whole-topic test draws wider, again matching Maths. */
export const QUESTIONS_PER_NVR_TOPIC_TEST = 12;

/**
 * The fields a student may see.
 *
 * ansChoice and ansExplain are withheld until the round is graded, exactly as
 * in the other two subjects - the answer key never reaches the browser.
 */
export const nvrQuestionPublicSelect = {
  id: true,
  topic: true,
  subTopic: true,
  typeOfQuestion: true,
  quest: true,
  stemFormat: true,
  stemFigure: true,
  optionFormat: true,
  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,
  optionE: true,
  difficultyLevel: true,
} as const;

export interface NvrSubTopicCount {
  subTopic: string;
  count: number;
}

export interface NvrTopicGroup {
  topic: string;
  subTopics: NvrSubTopicCount[];
  /** Total questions across this topic at the chosen difficulty. */
  count: number;
}

/** Every difficulty that actually has questions behind it. */
export async function availableNvrLevels(): Promise<string[]> {
  const rows = await prisma.gsNvrQuestion.groupBy({
    by: ["difficultyLevel"],
    _count: { _all: true },
  });

  return sortDifficulties(rows.map((row) => row.difficultyLevel));
}

/**
 * Subtopics at one difficulty, grouped under their topic so the picker can
 * show one collapsible frame per topic - the same shape as Maths.
 */
export async function nvrTopicsForLevel(
  level: string
): Promise<NvrTopicGroup[]> {
  const rows = await prisma.gsNvrQuestion.groupBy({
    by: ["topic", "subTopic"],
    where: { difficultyLevel: { equals: level, mode: "insensitive" } },
    _count: { _all: true },
  });

  const byTopic = new Map<string, NvrSubTopicCount[]>();
  for (const row of rows) {
    const bucket = byTopic.get(row.topic) ?? [];
    bucket.push({ subTopic: row.subTopic, count: row._count._all });
    byTopic.set(row.topic, bucket);
  }

  return Array.from(byTopic.entries())
    .map(([topic, subTopics]) => ({
      topic,
      subTopics: subTopics.sort((a, b) => a.subTopic.localeCompare(b.subTopic)),
      count: subTopics.reduce((total, s) => total + s.count, 0),
    }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

/** Fisher-Yates: every ordering equally likely, unlike sort(() => 0.5 - rnd). */
function shuffled(ids: number[]): number[] {
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A random draw from one subtopic at one difficulty. */
export async function randomNvrQuestionIds(
  subTopic: string,
  level: string,
  take: number = QUESTIONS_PER_NVR_ROUND
): Promise<number[]> {
  const rows = await prisma.gsNvrQuestion.findMany({
    where: {
      subTopic: { equals: subTopic, mode: "insensitive" },
      difficultyLevel: { equals: level, mode: "insensitive" },
    },
    select: { id: true },
  });

  return shuffled(rows.map((row) => row.id)).slice(0, take);
}

/** A random draw across every subtopic of one topic. */
export async function randomNvrQuestionIdsForTopic(
  topic: string,
  level: string,
  take: number = QUESTIONS_PER_NVR_TOPIC_TEST
): Promise<number[]> {
  const rows = await prisma.gsNvrQuestion.findMany({
    where: {
      topic: { equals: topic, mode: "insensitive" },
      difficultyLevel: { equals: level, mode: "insensitive" },
    },
    select: { id: true },
  });

  return shuffled(rows.map((row) => row.id)).slice(0, take);
}

/**
 * Strips anything executable out of stored SVG before it is rendered.
 *
 * The database already refuses such markup (see the nvr_no_markup check in
 * migration 018), so this is the second line rather than the only one - a
 * figure that somehow got in by another route still cannot run here.
 *
 * Only shapes and their geometry survive, which is all an NVR figure needs.
 */
const ALLOWED_SVG_TAGS =
  /^(svg|g|path|rect|circle|ellipse|line|polyline|polygon|text|tspan|defs|marker|title|desc)$/i;

export function sanitiseFigure(markup: string | null): string {
  if (!markup) return "";

  return (
    markup
      // Any tag that is not a plain shape goes, content and all.
      .replace(/<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g, (tag, name: string) =>
        ALLOWED_SVG_TAGS.test(name) ? tag : ""
      )
      // Event handlers, in any casing or spacing.
      .replace(/\son[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g, "")
      // javascript: in href, xlink:href, style or anywhere else.
      .replace(/\s(?:xlink:)?href\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/javascript:/gi, "")
  );
}

/** Key for the per-cell attempt map: one subtopic at one difficulty. */
export function nvrCellKey(subTopic: string, level: string): string {
  return `${subTopic.toLowerCase()}|${level.toLowerCase()}`;
}

/** Key for a whole-topic test: the topic at one difficulty. */
export function nvrTopicKey(topic: string, level: string): string {
  return `topic:${topic.toLowerCase()}|${level.toLowerCase()}`;
}

/**
 * The student's three most recent scores, newest first, keyed by what the
 * round was. Same shape as recentMathsAttempts, so the picker renders the
 * chips identically.
 */
export async function recentNvrAttempts(
  studentId: number,
  maxTests = 300
): Promise<Map<string, TestScore[]>> {
  const tests = await prisma.testTrackerNvrMain.findMany({
    where: { studentId },
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
    if (test.questions.length === 0 || !test.difficultyLevel) continue;

    const key = test.subTopic
      ? nvrCellKey(test.subTopic, test.difficultyLevel)
      : test.topic
      ? nvrTopicKey(test.topic, test.difficultyLevel)
      : null;
    if (!key) continue;

    const bucket = byKey.get(key) ?? [];
    // Rounds arrive newest-first, so the first three seen are the ones wanted.
    if (bucket.length >= 3) continue;

    const correct = test.questions.filter((q) => q.isAnsRight).length;
    bucket.push({
      testId: test.id,
      percentage: Math.round((correct / test.questions.length) * 100),
    });
    byKey.set(key, bucket);
  }

  return byKey;
}

/**
 * One past round with every question, the answer given and the right answer,
 * in the order it was presented. Scoped to the student, so a guessed id cannot
 * open someone else's test. Figures still need sanitiseFigure before render.
 */
export async function nvrTestReview(testId: number, studentId: number) {
  return prisma.testTrackerNvrMain.findFirst({
    where: { id: testId, studentId },
    select: {
      id: true,
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
          question: {
            select: {
              quest: true,
              stemFigure: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
              optionE: true,
              ansChoice: true,
              ansExplain: true,
            },
          },
        },
      },
    },
  });
}
