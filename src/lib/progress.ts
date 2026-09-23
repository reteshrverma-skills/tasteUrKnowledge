import { prisma } from "@/lib/prisma";

/**
 * What each difficulty level is actually testing.
 *
 * English question rows carry a `topic` for the skill being tested, but almost
 * none are tagged yet, so "needs work" falls back to the level. Naming the
 * level alone tells a parent nothing - "Challenger 42%" is not actionable -
 * whereas the skills behind it are.
 */
export const LEVEL_SKILLS: Record<string, string> = {
  Starter: "Retrieval, basic vocabulary, sequencing",
  Explorer: "Synonyms, antonyms, simple inference, cause/effect",
  Challenger:
    "Deeper inference, character motivation, evidence, author's purpose",
  "Think Harder":
    "Implicit meaning, writer's viewpoint, language effect, structure, multiple-step inference",
};

export function skillsFor(level: string | null | undefined): string | null {
  if (!level) return null;
  const match = Object.keys(LEVEL_SKILLS).find(
    (key) => key.toLowerCase() === level.trim().toLowerCase()
  );
  return match ? LEVEL_SKILLS[match] : null;
}

/* ------------------------------------------------------------------ */
/* Time spent                                                          */
/* ------------------------------------------------------------------ */

export interface TimeSpent {
  todaySeconds: number;
  weekSeconds: number;
  monthSeconds: number;
}

export interface SubjectTime extends TimeSpent {
  subject: string;
}

const ZERO: TimeSpent = { todaySeconds: 0, weekSeconds: 0, monthSeconds: 0 };

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
}

function toTimeSpent(row: Bucketed | undefined): TimeSpent {
  if (!row) return ZERO;
  return {
    todaySeconds: num(row.today),
    weekSeconds: num(row.week),
    monthSeconds: num(row.month),
  };
}

/**
 * Time this student spent on each subject today, this week and this month.
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

  const [english, maths] = await Promise.all([
    prisma.$queryRaw<Bucketed[]>`
      SELECT
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${today}), 0) AS today,
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${week}),  0) AS week,
        COALESCE(SUM(t.secs), 0)                                     AS month
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
           AND m."testStartTime" >= ${month}
      ) t`,
    prisma.$queryRaw<Bucketed[]>`
      SELECT
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${today}), 0) AS today,
        COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${week}),  0) AS week,
        COALESCE(SUM(t.secs), 0)                                     AS month
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
           AND m."testStartTime" >= ${month}
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
  subject: "English" | "Maths";
  /** The subtopic, skill or level this covers. */
  label: string;
  /** What that actually means, when the label alone is not plain English. */
  detail: string | null;
  percentage: number;
  attempted: number;
}

export interface SkillBreakdown {
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

function toAreas(
  rows: ScoreRow[],
  subject: SkillArea["subject"],
  detailFor: (bucket: string) => string | null
): SkillArea[] {
  return rows
    .filter((row) => row.bucket && num(row.total) >= MIN_ATTEMPTED)
    .map((row) => {
      const total = num(row.total);
      return {
        subject,
        label: row.bucket as string,
        detail: detailFor(row.bucket as string),
        percentage: Math.round((num(row.correct) / total) * 100),
        attempted: total,
      };
    });
}

/**
 * What this student is good at and what they are not, from one pass over the
 * tracker rows.
 *
 * Maths is grouped by the question's own subtopic rather than the round's,
 * because a whole-topic test spans several and the round only records one.
 * English is grouped by question skill where that is tagged, and by difficulty
 * level otherwise - see LEVEL_SKILLS.
 *
 * Both lists come from the same aggregation and the same threshold, so a topic
 * can never appear in both, and every topic with enough answers behind it
 * lands in exactly one.
 */
export async function skillBreakdown(
  studentId: number,
  limit = 3
): Promise<SkillBreakdown> {
  const [mathsRows, englishTopicRows, englishLevelRows] = await Promise.all([
    prisma.$queryRaw<ScoreRow[]>`
      SELECT gq."subTopic" AS bucket,
             COUNT(*)                               AS total,
             COUNT(*) FILTER (WHERE q."isAnsRight") AS correct
        FROM "testTrackerMath" q
        JOIN "gsMathsQuestions" gq ON gq."id" = q."questionId"
       WHERE q."studentId" = ${studentId}
         AND gq."subTopic" IS NOT NULL
       GROUP BY gq."subTopic"`,
    prisma.$queryRaw<ScoreRow[]>`
      SELECT q."topic" AS bucket,
             COUNT(*)                               AS total,
             COUNT(*) FILTER (WHERE q."isAnsRight") AS correct
        FROM "testTrackerEnglish" q
       WHERE q."studentId" = ${studentId}
         AND q."topic" IS NOT NULL
         AND lower(btrim(q."topic")) <> 'comp'
       GROUP BY q."topic"`,
    prisma.$queryRaw<ScoreRow[]>`
      SELECT m."difficultyLevel" AS bucket,
             COUNT(*)                               AS total,
             COUNT(*) FILTER (WHERE q."isAnsRight") AS correct
        FROM "testTrackerEnglish" q
        JOIN "testTrackerEnglishMain" m ON m."id" = q."testId"
       WHERE q."studentId" = ${studentId}
         AND m."difficultyLevel" IS NOT NULL
       GROUP BY m."difficultyLevel"`,
  ]);

  const maths = toAreas(mathsRows, "Maths", () => null);

  // Skill tags are the better answer when they exist; levels are the fallback
  // so the panels are not blank on untagged content. The choice is made once,
  // on whether any tagged topic has enough answers behind it, so strengths and
  // weaknesses are always described in the same terms as each other.
  const byTopic = toAreas(englishTopicRows, "English", skillsFor);
  const english =
    byTopic.length > 0
      ? byTopic
      : toAreas(englishLevelRows, "English", skillsFor);

  const all = [...maths, ...english];

  return {
    strengths: all
      .filter((area) => area.percentage >= STRONG_THRESHOLD)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, limit),
    weaknesses: all
      .filter((area) => area.percentage < STRONG_THRESHOLD)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, limit),
  };
}
