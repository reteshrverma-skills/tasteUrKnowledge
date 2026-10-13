import { prisma } from "@/lib/prisma";

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
}

/**
 * The line between the two lists, and the same one the score chips already
 * draw elsewhere in the app: green at 70 and up, amber or red below. Using a
 * different cut-off here would mean a parent sees a topic chipped green on one
 * screen and listed as a weakness on another.
 */
export const STRONG_THRESHOLD = 70;

/**
 * Fewer answers than this is noise, not a verdict. Two out of two says far
 * less than nine out of fifteen, in either direction - a single lucky question
 * is not a strength any more than a single unlucky one is a weakness.
 */
export const MIN_ATTEMPTED = 4;

interface ScoreRow {
  bucket: string | null;
  total: unknown;
  correct: unknown;
}

/** "author's purpose" -> "Author's purpose": tags are stored in mixed case. */
function sentenceCase(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Correct/answered per topic in one subject, from every answer the student
 * gave.
 *
 * Grouped by the question's own tags rather than the round's, because a
 * whole-topic test spans several subtopics and the round records only one.
 * - English: question type (Retrieval, inference, vocabulary...), compared
 *   ignoring case, as the bank holds both "Sequencing" and "sequencing".
 * - Maths: subtopic.
 * - Verbal and Non-Verbal: "topic · subtopic", since their subtopic names
 *   repeat across topics ("Compare" sits under two Non-Verbal topics).
 */
async function scoreRows(
  studentId: number,
  subject: ProgressSubject
): Promise<ScoreRow[]> {
  switch (subject) {
    case "English":
      return prisma.$queryRaw<ScoreRow[]>`
        SELECT lower(btrim(COALESCE(gq."typeOfQuestion", q."topic"))) AS bucket,
               COUNT(*)                               AS total,
               COUNT(*) FILTER (WHERE q."isAnsRight") AS correct
          FROM "testTrackerEnglish" q
          JOIN "gsEnglishQuestions" gq ON gq."id" = q."questionId"
         WHERE q."studentId" = ${studentId}
           AND btrim(COALESCE(gq."typeOfQuestion", q."topic", '')) <> ''
         GROUP BY 1`;
    case "Maths":
      return prisma.$queryRaw<ScoreRow[]>`
        SELECT gq."subTopic" AS bucket,
               COUNT(*)                               AS total,
               COUNT(*) FILTER (WHERE q."isAnsRight") AS correct
          FROM "testTrackerMath" q
          JOIN "gsMathsQuestions" gq ON gq."id" = q."questionId"
         WHERE q."studentId" = ${studentId}
           AND gq."subTopic" IS NOT NULL
         GROUP BY gq."subTopic"`;
    case "Verbal Reasoning":
      return prisma.$queryRaw<ScoreRow[]>`
        SELECT concat_ws(' · ', gq."topic", gq."subTopic") AS bucket,
               COUNT(*)                               AS total,
               COUNT(*) FILTER (WHERE q."isAnsRight") AS correct
          FROM "testTrackerVR" q
          JOIN "gsVRQuestions" gq ON gq."id" = q."questionId"
         WHERE q."studentId" = ${studentId}
           AND gq."subTopic" IS NOT NULL
         GROUP BY 1`;
    case "Non-Verbal":
      return prisma.$queryRaw<ScoreRow[]>`
        SELECT concat_ws(' · ', gq."topic", gq."subTopic") AS bucket,
               COUNT(*)                               AS total,
               COUNT(*) FILTER (WHERE q."isAnsRight") AS correct
          FROM "testTrackerNvr" q
          JOIN "gsNvrQuestions" gq ON gq."id" = q."questionId"
         WHERE q."studentId" = ${studentId}
         GROUP BY 1`;
  }
}

/** Every topic with any answers, strongest first. */
function toAreas(rows: ScoreRow[]): SkillArea[] {
  return rows
    .filter((row) => row.bucket && num(row.total) > 0)
    .map((row) => {
      const total = num(row.total);
      return {
        label: sentenceCase(row.bucket as string),
        percentage: Math.round((num(row.correct) / total) * 100),
        attempted: total,
      };
    })
    .sort((a, b) => b.percentage - a.percentage || b.attempted - a.attempted);
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
  const [rows, testRows] = await Promise.all([
    scoreRows(studentId, subject),
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
