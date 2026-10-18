import { prisma } from "@/lib/prisma";
import {
  ENGLISH_FAMILY_ORDER,
  FOCUS_COUNT,
  MIN_ANSWERS,
  TARGET_PERCENT,
  TREND_DAYS,
  englishFamilyFor,
} from "@/lib/progress-config";

/* ------------------------------------------------------------------ */
/* Subjects                                                            */
/* ------------------------------------------------------------------ */

/** Every subject a parent sees progress for, in display order. */
export const PROGRESS_SUBJECTS = [
  { subject: "English", slug: "english" },
  { subject: "Maths", slug: "maths" },
  { subject: "Verbal Reasoning", slug: "verbal" },
  { subject: "Non-Verbal", slug: "non-verbal" },
] as const;

export type ProgressSubject = (typeof PROGRESS_SUBJECTS)[number]["subject"];

export function subjectForSlug(slug: string): ProgressSubject | null {
  return PROGRESS_SUBJECTS.find((s) => s.slug === slug)?.subject ?? null;
}

export function slugForSubject(subject: ProgressSubject): string {
  return PROGRESS_SUBJECTS.find((s) => s.subject === subject)!.slug;
}

/* ------------------------------------------------------------------ */
/* Time spent                                                          */
/* ------------------------------------------------------------------ */

export interface TimeSpent {
  todaySeconds: number;
  weekSeconds: number;
  monthSeconds: number;
  allTimeSeconds: number;
}

export interface SubjectTime extends TimeSpent {
  subject: ProgressSubject;
}

const ZERO: TimeSpent = {
  todaySeconds: 0,
  weekSeconds: 0,
  monthSeconds: 0,
  allTimeSeconds: 0,
};

/**
 * Start of today, of this week and of this month, in the server's own zone.
 *
 * The week starts on Monday, as UK schools count it. These are real local
 * boundaries rather than "now minus 24 hours": a parent asking what their
 * child did today means the calendar day, not a rolling window.
 */
export function periodBoundaries(now: Date = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const week = new Date(today);
  // getDay() is 0 for Sunday, so Sunday counts back six days, not none.
  const daysSinceMonday = (today.getDay() + 6) % 7;
  week.setDate(week.getDate() - daysSinceMonday);

  const month = new Date(today.getFullYear(), today.getMonth(), 1);

  return { today, week, month };
}

/** Raw numerics come back as string, bigint or Decimal depending on the driver. */
function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

interface Bucketed {
  today: unknown;
  week: unknown;
  month: unknown;
  alltime: unknown;
}

function toTimeSpent(row: Bucketed | undefined): TimeSpent {
  if (!row) return ZERO;
  return {
    todaySeconds: num(row.today),
    weekSeconds: num(row.week),
    monthSeconds: num(row.month),
    allTimeSeconds: num(row.alltime),
  };
}

/**
 * Time this student spent on each subject today, this week, this month, and
 * all time.
 *
 * The three calendar buckets reset on their boundary - on the 1st of a month
 * "this month" is near-empty even for a child who practised all through the
 * last one. All-time is included alongside so the figure still lines up with
 * the all-time Strengths panel and the dashboard never looks blank.
 *
 * English counts the passage reading as well as the questions - for a
 * comprehension the reading *is* most of the work, and leaving it out would
 * report a child who read carefully for four minutes as having done almost
 * nothing.
 */
export async function timeSpentBySubject(
  studentId: number
): Promise<SubjectTime[]> {
  const { today, week, month } = periodBoundaries();

  // No outer date bound: every round is in scope and each column is a FILTER
  // on top, with all-time the unfiltered total.
  const [english, maths, verbal, nonVerbal] = await Promise.all([
    prisma.$queryRaw<Bucketed[]>`
      SELECT
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${today}), 0) AS today,
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${week}),  0) AS week,
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${month}), 0) AS month,
        COALESCE(SUM(t.secs), 0)                                     AS alltime
      FROM (
        SELECT
          m."testStartTime" AS started,
          COALESCE(m."passageReadSeconds", 0)
            + COALESCE((
                SELECT SUM(q."timeSpentOnQuestion")
                  FROM "testTrackerEnglish" q
                 WHERE q."testId" = m."id"
              ), 0) AS secs
          FROM "testTrackerEnglishMain" m
         WHERE m."studentId" = ${studentId}
      ) t`,
    prisma.$queryRaw<Bucketed[]>`
      SELECT
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${today}), 0) AS today,
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${week}),  0) AS week,
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${month}), 0) AS month,
        COALESCE(SUM(t.secs), 0)                                     AS alltime
      FROM (
        SELECT
          m."testStartTime" AS started,
          COALESCE((
            SELECT SUM(q."timeSpentOnQuestion")
              FROM "testTrackerMath" q
             WHERE q."testId" = m."id"
          ), 0) AS secs
          FROM "testTrackerMathMain" m
         WHERE m."studentId" = ${studentId}
      ) t`,
    // VR's testStartTime has no time zone. Prisma writes it as UTC, so it is
    // read back as UTC before comparing with the zoned boundaries.
    prisma.$queryRaw<Bucketed[]>`
      SELECT
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${today}), 0) AS today,
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${week}),  0) AS week,
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${month}), 0) AS month,
        COALESCE(SUM(t.secs), 0)                                     AS alltime
      FROM (
        SELECT
          m."testStartTime" AT TIME ZONE 'UTC' AS started,
          COALESCE((
            SELECT SUM(q."timeSpentOnQuestion")
              FROM "testTrackerVR" q
             WHERE q."testId" = m."id"
          ), 0) AS secs
          FROM "testTrackerVRMain" m
         WHERE m."studentId" = ${studentId}
      ) t`,
    prisma.$queryRaw<Bucketed[]>`
      SELECT
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${today}), 0) AS today,
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${week}),  0) AS week,
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${month}), 0) AS month,
        COALESCE(SUM(t.secs), 0)                                     AS alltime
      FROM (
        SELECT
          m."testStartTime" AS started,
          COALESCE((
            SELECT SUM(q."timeSpentOnQuestion")
              FROM "testTrackerNvr" q
             WHERE q."testId" = m."id"
          ), 0) AS secs
          FROM "testTrackerNvrMain" m
         WHERE m."studentId" = ${studentId}
      ) t`,
  ]);

  return [
    { subject: "English", ...toTimeSpent(english[0]) },
    { subject: "Maths", ...toTimeSpent(maths[0]) },
    { subject: "Verbal Reasoning", ...toTimeSpent(verbal[0]) },
    { subject: "Non-Verbal", ...toTimeSpent(nonVerbal[0]) },
  ];
}

/** "1h 04m", "12m", "45s" - a parent reads duration, not seconds. */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  if (total <= 0) return "—";
  if (total < 60) return `${total}s`;

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

/* ------------------------------------------------------------------ */
/* Strengths and weaknesses                                            */
/* ------------------------------------------------------------------ */

export interface SkillArea {
  /** The subtopic, or for English the question type. */
  label: string;
  percentage: number;
  attempted: number;
  correct: number;
  /**
   * The score as it stood TREND_DAYS ago, or null when there was too little
   * then to compare with, or nothing new has been answered since.
   */
  previousPercentage: number | null;
  /** Answers and correct ones up to TREND_DAYS ago, for family trends. */
  previousAttempted: number;
  previousCorrect: number;
  /** What a practice round for this area is built from. */
  practice: PracticeTarget;
}

/**
 * Enough to start a round on one area: the English question type, or the
 * topic/subtopic of the other banks, at the level last practised.
 */
export interface PracticeTarget {
  topic: string | null;
  subTopic: string | null;
  level: string | null;
}

/**
 * Green from here up. Read from src/config/progress.json so the parent
 * dashboard and the details page draw the line in the same place.
 */
export const STRONG_THRESHOLD = TARGET_PERCENT;

/**
 * Fewer answers than this is noise, not a verdict. Two out of two says far
 * less than nine out of fifteen, in either direction - a single lucky question
 * is not a strength any more than a single unlucky one is a weakness.
 */
export const MIN_ATTEMPTED = MIN_ANSWERS;

interface ScoreRow {
  bucket: string | null;
  topic: string | null;
  subtopic: string | null;
  level: string | null;
  total: unknown;
  correct: unknown;
  prev_total: unknown;
  prev_correct: unknown;
}

/** "author's purpose" -> "Author's purpose": tags are stored in mixed case. */
function sentenceCase(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Correct/answered per topic in one subject, from every answer the student
 * gave, plus the same counts up to `before` for the trend.
 *
 * Grouped by the question's own tags rather than the round's, because a
 * whole-topic test spans several subtopics and the round records only one.
 * - English: question type (Retrieval, inference, vocabulary...), compared
 *   ignoring case, as the bank holds both "Sequencing" and "sequencing".
 * - Maths: subtopic.
 * - Verbal and Non-Verbal: "topic · subtopic", since their subtopic names
 *   repeat across topics ("Compare" sits under two Non-Verbal topics).
 *
 * `level` is the difficulty of the most recent round that touched the area,
 * which is where "Practise this" starts the next one.
 */
async function scoreRows(
  studentId: number,
  subject: ProgressSubject,
  before: Date
): Promise<ScoreRow[]> {
  switch (subject) {
    case "English":
      return prisma.$queryRaw<ScoreRow[]>`
        SELECT lower(btrim(COALESCE(gq."typeOfQuestion", q."topic"))) AS bucket,
               min(btrim(COALESCE(gq."typeOfQuestion", q."topic"))) AS topic,
               NULL::text AS subtopic,
               (array_agg(m."difficultyLevel" ORDER BY m."testStartTime" DESC))[1] AS level,
               COUNT(*)                               AS total,
               COUNT(*) FILTER (WHERE q."isAnsRight") AS correct,
               COUNT(*) FILTER (WHERE m."testStartTime" < ${before}) AS prev_total,
               COUNT(*) FILTER (WHERE m."testStartTime" < ${before} AND q."isAnsRight") AS prev_correct
          FROM "testTrackerEnglish" q
          JOIN "gsEnglishQuestions" gq ON gq."id" = q."questionId"
          JOIN "testTrackerEnglishMain" m ON m."id" = q."testId"
         WHERE q."studentId" = ${studentId}
           AND btrim(COALESCE(gq."typeOfQuestion", q."topic", '')) <> ''
         GROUP BY 1`;
    case "Maths":
      return prisma.$queryRaw<ScoreRow[]>`
        SELECT gq."subTopic" AS bucket,
               min(gq."topic") AS topic,
               gq."subTopic" AS subtopic,
               (array_agg(m."difficultyLevel" ORDER BY m."testStartTime" DESC))[1] AS level,
               COUNT(*)                               AS total,
               COUNT(*) FILTER (WHERE q."isAnsRight") AS correct,
               COUNT(*) FILTER (WHERE m."testStartTime" < ${before}) AS prev_total,
               COUNT(*) FILTER (WHERE m."testStartTime" < ${before} AND q."isAnsRight") AS prev_correct
          FROM "testTrackerMath" q
          JOIN "gsMathsQuestions" gq ON gq."id" = q."questionId"
          JOIN "testTrackerMathMain" m ON m."id" = q."testId"
         WHERE q."studentId" = ${studentId}
           AND gq."subTopic" IS NOT NULL
         GROUP BY gq."subTopic"`;
    case "Verbal Reasoning":
      // VR's testStartTime has no time zone; it is written as UTC.
      return prisma.$queryRaw<ScoreRow[]>`
        SELECT concat_ws(' · ', gq."topic", gq."subTopic") AS bucket,
               gq."topic" AS topic,
               gq."subTopic" AS subtopic,
               (array_agg(m."difficultyLevel" ORDER BY m."testStartTime" DESC))[1] AS level,
               COUNT(*)                               AS total,
               COUNT(*) FILTER (WHERE q."isAnsRight") AS correct,
               COUNT(*) FILTER (WHERE m."testStartTime" AT TIME ZONE 'UTC' < ${before}) AS prev_total,
               COUNT(*) FILTER (WHERE m."testStartTime" AT TIME ZONE 'UTC' < ${before} AND q."isAnsRight") AS prev_correct
          FROM "testTrackerVR" q
          JOIN "gsVRQuestions" gq ON gq."id" = q."questionId"
          JOIN "testTrackerVRMain" m ON m."id" = q."testId"
         WHERE q."studentId" = ${studentId}
           AND gq."subTopic" IS NOT NULL
         GROUP BY gq."topic", gq."subTopic"`;
    case "Non-Verbal":
      return prisma.$queryRaw<ScoreRow[]>`
        SELECT concat_ws(' · ', gq."topic", gq."subTopic") AS bucket,
               gq."topic" AS topic,
               gq."subTopic" AS subtopic,
               (array_agg(m."difficultyLevel" ORDER BY m."testStartTime" DESC))[1] AS level,
               COUNT(*)                               AS total,
               COUNT(*) FILTER (WHERE q."isAnsRight") AS correct,
               COUNT(*) FILTER (WHERE m."testStartTime" < ${before}) AS prev_total,
               COUNT(*) FILTER (WHERE m."testStartTime" < ${before} AND q."isAnsRight") AS prev_correct
          FROM "testTrackerNvr" q
          JOIN "gsNvrQuestions" gq ON gq."id" = q."questionId"
          JOIN "testTrackerNvrMain" m ON m."id" = q."testId"
         WHERE q."studentId" = ${studentId}
         GROUP BY gq."topic", gq."subTopic"`;
  }
}

/** Every topic with any answers, weakest first. */
function toAreas(rows: ScoreRow[]): SkillArea[] {
  return rows
    .filter((row) => row.bucket && num(row.total) > 0)
    .map((row) => {
      const total = num(row.total);
      const correct = num(row.correct);
      const prevTotal = num(row.prev_total);
      // A trend needs a fair sample then, and something answered since.
      const previousPercentage =
        prevTotal >= MIN_ANSWERS && total > prevTotal
          ? Math.round((num(row.prev_correct) / prevTotal) * 100)
          : null;
      return {
        label: sentenceCase(row.bucket as string),
        percentage: Math.round((correct / total) * 100),
        attempted: total,
        correct,
        previousPercentage,
        previousAttempted: prevTotal,
        previousCorrect: num(row.prev_correct),
        practice: {
          topic: row.topic,
          subTopic: row.subtopic,
          level: row.level,
        },
      };
    })
    .sort((a, b) => a.percentage - b.percentage || b.attempted - a.attempted);
}

/**
 * The areas worth working on this week, biggest impact first.
 *
 * Impact is volume times gap: answers given times the share got wrong, which
 * is simply the number of questions missed. A topic at 0% from four answers
 * is a weaker signal than one at 31% from thirty-six, so sorting by score
 * alone would point a parent at the wrong thing. Areas below MIN_ANSWERS or
 * already on target are left out.
 */
export function focusNext(areas: SkillArea[]): SkillArea[] {
  return areas
    .filter((a) => a.attempted >= MIN_ANSWERS && a.percentage < TARGET_PERCENT)
    .map((a) => ({ area: a, impact: a.attempted - a.correct }))
    .sort((x, y) => y.impact - x.impact)
    .slice(0, FOCUS_COUNT)
    .map((x) => x.area);
}

export interface SkillFamily {
  name: string;
  percentage: number;
  attempted: number;
  correct: number;
  previousPercentage: number | null;
  areas: SkillArea[];
}

/**
 * English question types gathered into the families named in
 * src/config/progress.json, each scored on all its answers together, weakest
 * family first. Types the config does not list fall under "Other skills".
 */
export function englishFamilies(areas: SkillArea[]): SkillFamily[] {
  const byName = new Map<string, SkillArea[]>();
  for (const area of areas) {
    const name = englishFamilyFor(area.label);
    byName.set(name, [...(byName.get(name) ?? []), area]);
  }

  return Array.from(byName.entries())
    .map(([name, members]) => {
      const attempted = members.reduce((n, a) => n + a.attempted, 0);
      const correct = members.reduce((n, a) => n + a.correct, 0);

      // The family score as it stood a week ago, from every member's answers
      // then - the same rule as a single topic's trend.
      const prevAttempted = members.reduce((n, a) => n + a.previousAttempted, 0);
      const prevCorrect = members.reduce((n, a) => n + a.previousCorrect, 0);
      const previousPercentage =
        prevAttempted >= MIN_ANSWERS && attempted > prevAttempted
          ? Math.round((prevCorrect / prevAttempted) * 100)
          : null;

      return {
        name,
        attempted,
        correct,
        percentage: Math.round((correct / attempted) * 100),
        previousPercentage,
        areas: members,
      };
    })
    .sort(
      (a, b) =>
        a.percentage - b.percentage ||
        ENGLISH_FAMILY_ORDER.indexOf(a.name) - ENGLISH_FAMILY_ORDER.indexOf(b.name)
    );
}

/* ------------------------------------------------------------------ */
/* One subject in full, for the parent's details page                  */
/* ------------------------------------------------------------------ */

export interface RecentTest {
  id: number;
  startedAt: Date | null;
  /** What the round was: subtopic, topic or comprehension title. */
  label: string;
  level: string | null;
  correct: number;
  total: number;
  percentage: number;
}

interface TestRow {
  id: unknown;
  started: Date | null;
  label: string | null;
  level: string | null;
  total: unknown;
  correct: unknown;
}

async function recentTestRows(
  studentId: number,
  subject: ProgressSubject,
  take: number
): Promise<TestRow[]> {
  switch (subject) {
    case "English":
      return prisma.$queryRaw<TestRow[]>`
        SELECT m."id", m."testStartTime" AS started,
               COALESCE(c."label", m."topic") AS label,
               m."difficultyLevel" AS level,
               COUNT(q."id") AS total,
               COUNT(q."id") FILTER (WHERE q."isAnsRight") AS correct
          FROM "testTrackerEnglishMain" m
          LEFT JOIN "gsEnglishComp" c ON c."id" = m."gsEngCompId"
          LEFT JOIN "testTrackerEnglish" q ON q."testId" = m."id"
         WHERE m."studentId" = ${studentId}
         GROUP BY m."id", c."label"
         ORDER BY m."testStartTime" DESC
         LIMIT ${take}`;
    case "Maths":
      return prisma.$queryRaw<TestRow[]>`
        SELECT m."id", m."testStartTime" AS started,
               COALESCE(m."subTopic", m."topic") AS label,
               m."difficultyLevel" AS level,
               COUNT(q."id") AS total,
               COUNT(q."id") FILTER (WHERE q."isAnsRight") AS correct
          FROM "testTrackerMathMain" m
          LEFT JOIN "testTrackerMath" q ON q."testId" = m."id"
         WHERE m."studentId" = ${studentId}
         GROUP BY m."id"
         ORDER BY m."testStartTime" DESC
         LIMIT ${take}`;
    case "Verbal Reasoning":
      return prisma.$queryRaw<TestRow[]>`
        SELECT m."id", m."testStartTime" AT TIME ZONE 'UTC' AS started,
               COALESCE(m."subTopic", m."topic") AS label,
               m."difficultyLevel" AS level,
               COUNT(q."id") AS total,
               COUNT(q."id") FILTER (WHERE q."isAnsRight") AS correct
          FROM "testTrackerVRMain" m
          LEFT JOIN "testTrackerVR" q ON q."testId" = m."id"
         WHERE m."studentId" = ${studentId}
         GROUP BY m."id"
         ORDER BY m."testStartTime" DESC
         LIMIT ${take}`;
    case "Non-Verbal":
      return prisma.$queryRaw<TestRow[]>`
        SELECT m."id", m."testStartTime" AS started,
               COALESCE(m."subTopic", m."topic") AS label,
               m."difficultyLevel" AS level,
               COUNT(q."id") AS total,
               COUNT(q."id") FILTER (WHERE q."isAnsRight") AS correct
          FROM "testTrackerNvrMain" m
          LEFT JOIN "testTrackerNvr" q ON q."testId" = m."id"
         WHERE m."studentId" = ${studentId}
         GROUP BY m."id"
         ORDER BY m."testStartTime" DESC
         LIMIT ${take}`;
  }
}

/** Every topic score and the latest tests in one subject. */
export async function subjectDetail(
  studentId: number,
  subject: ProgressSubject,
  take = 20
): Promise<{ areas: SkillArea[]; tests: RecentTest[] }> {
  const trendFrom = new Date(Date.now() - TREND_DAYS * 24 * 60 * 60 * 1000);
  const [rows, testRows] = await Promise.all([
    scoreRows(studentId, subject, trendFrom),
    recentTestRows(studentId, subject, take),
  ]);

  return {
    areas: toAreas(rows),
    tests: testRows
      // A round with no answers recorded says nothing about the child.
      .filter((t) => num(t.total) > 0)
      .map((t) => {
        const total = num(t.total);
        const correct = num(t.correct);
        return {
          id: num(t.id),
          startedAt: t.started,
          label: t.label?.trim() || subject,
          level: t.level,
          correct,
          total,
          percentage: Math.round((correct / total) * 100),
        };
      }),
  };
}
