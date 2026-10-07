import { prisma } from "@/lib/prisma";

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
  subject: string;
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

/** Raw numerics come back as string or Decimal depending on the driver. */
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

  // No outer date bound now: every round is in scope and each column is a
  // FILTER on top, with all-time the unfiltered total.
  const [english, maths] = await Promise.all([
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
  ]);

  return [
    { subject: "English", ...toTimeSpent(english[0]) },
    { subject: "Maths", ...toTimeSpent(maths[0]) },
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
  /** The Maths subtopic, or the English question type. */
  label: string;
  percentage: number;
  attempted: number;
}

/** One subject's best and weakest topics. */
export interface SkillBreakdown {
  subject: "English" | "Maths";
  strengths: SkillArea[];
  weaknesses: SkillArea[];
}

/**
 * The line between the two lists, and the same one the score chips already
 * draw elsewhere in the app: green at 70 and up, amber or red below. Using a
 * different cut-off here would mean a parent sees a topic chipped green on one
 * screen and listed as a weakness on another.
 */
const STRONG_THRESHOLD = 70;

/**
 * Fewer answers than this is noise, not a verdict. Two out of two says far
 * less than nine out of fifteen, in either direction - a single lucky question
 * is not a strength any more than a single unlucky one is a weakness.
 */
const MIN_ATTEMPTED = 4;

interface ScoreRow {
  bucket: string | null;
  total: unknown;
  correct: unknown;
}

/** "author's purpose" -> "Author's purpose": tags are stored in mixed case. */
function sentenceCase(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function toBreakdown(
  subject: SkillBreakdown["subject"],
  rows: ScoreRow[],
  limit: number
): SkillBreakdown {
  const areas = rows
    .filter((row) => row.bucket && num(row.total) >= MIN_ATTEMPTED)
    .map((row) => {
      const total = num(row.total);
      return {
        label: sentenceCase(row.bucket as string),
        percentage: Math.round((num(row.correct) / total) * 100),
        attempted: total,
      };
    });

  return {
    subject,
    strengths: areas
      .filter((area) => area.percentage >= STRONG_THRESHOLD)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, limit),
    weaknesses: areas
      .filter((area) => area.percentage < STRONG_THRESHOLD)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, limit),
  };
}

/**
 * What this student is good at and what they are not, per subject, so English
 * is never crowded out of a shared list by Maths.
 *
 * Maths is grouped by the question's own subtopic rather than the round's,
 * because a whole-topic test spans several and the round only records one.
 * English is grouped by question type (Retrieval, inference, vocabulary...),
 * read from the question bank so answers saved before the type was copied
 * onto the tracker row still count. Types are compared ignoring case, as the
 * bank holds both "Sequencing" and "sequencing".
 *
 * Both lists come from the same aggregation and the same threshold, so a topic
 * can never appear in both, and every topic with enough answers behind it
 * lands in exactly one.
 */
export async function skillBreakdown(
  studentId: number,
  limit = 3
): Promise<SkillBreakdown[]> {
  const [englishRows, mathsRows] = await Promise.all([
    prisma.$queryRaw<ScoreRow[]>`
      SELECT lower(btrim(COALESCE(gq."typeOfQuestion", q."topic"))) AS bucket,
             COUNT(*)                               AS total,
             COUNT(*) FILTER (WHERE q."isAnsRight") AS correct
        FROM "testTrackerEnglish" q
        JOIN "gsEnglishQuestions" gq ON gq."id" = q."questionId"
       WHERE q."studentId" = ${studentId}
         AND btrim(COALESCE(gq."typeOfQuestion", q."topic", '')) <> ''
       GROUP BY 1`,
    prisma.$queryRaw<ScoreRow[]>`
      SELECT gq."subTopic" AS bucket,
             COUNT(*)                               AS total,
             COUNT(*) FILTER (WHERE q."isAnsRight") AS correct
        FROM "testTrackerMath" q
        JOIN "gsMathsQuestions" gq ON gq."id" = q."questionId"
       WHERE q."studentId" = ${studentId}
         AND gq."subTopic" IS NOT NULL
       GROUP BY gq."subTopic"`,
  ]);

  return [
    toBreakdown("English", englishRows, limit),
    toBreakdown("Maths", mathsRows, limit),
  ];
}
