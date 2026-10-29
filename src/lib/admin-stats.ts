import { prisma } from "@/lib/prisma";

/**
 * Figures for the Product Director's statistics page (/director): accounts
 * by type, how many different students logged in today, this week and this
 * month, and how long students practised.
 *
 * Periods are UK calendar periods (Europe/London, so BST is handled): today
 * from midnight, the week from Monday, the month from the 1st. The server's
 * own clock is UTC on Azure, which would put "today" an hour off in summer.
 */

const TZ = "Europe/London";

/** Midnight UK time on a UK calendar date, as an instant. */
function ukMidnight(year: number, month: number, day: number): Date {
  const wallClock = Date.UTC(year, month - 1, day);
  const offset = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    timeZoneName: "shortOffset",
  })
    .formatToParts(wallClock)
    .find((p) => p.type === "timeZoneName")?.value;
  const hours = Number(offset?.replace("GMT", "") || 0);
  return new Date(wallClock - hours * 3_600_000);
}

export function ukPeriodStarts(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  // Mon = 0 ... Sun = 6, as UK schools count the week.
  const sinceMonday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(
    parts.weekday
  );

  return {
    today: ukMidnight(year, month, day),
    // Date.UTC rolls a day of 0 or less back into the previous month.
    week: ukMidnight(year, month, day - sinceMonday),
    month: ukMidnight(year, month, 1),
  };
}

export interface AdminStats {
  accounts: {
    students: number;
    parents: number;
    admins: number;
    directors: number;
    total: number;
  };
  /** Inactive (deactivated) accounts, included in the totals above. */
  inactive: number;
  studentLogins: { today: number; week: number; month: number };
  /** Minutes all students spent practising, across every subject. */
  practiceMinutes: { today: number; week: number; month: number; allTime: number };
}

interface LoginCounts {
  today: unknown;
  week: unknown;
  month: unknown;
}

interface PracticeSeconds extends LoginCounts {
  alltime: unknown;
}

export async function adminStats(): Promise<AdminStats> {
  const { today, week, month } = ukPeriodStarts();
  // The week can start in the previous month, so read from whichever is earlier.
  const from = week < month ? week : month;

  const [byType, inactive, logins, practice] = await Promise.all([
    prisma.userProfile.groupBy({ by: ["userType"], _count: { _all: true } }),
    prisma.userProfile.count({ where: { isActive: false } }),
    // Distinct students: one child logging in five times today counts once.
    prisma.$queryRaw<LoginCounts[]>`
      SELECT COUNT(DISTINCT s."userId") FILTER (WHERE s."loginAt" >= ${today}) AS today,
             COUNT(DISTINCT s."userId") FILTER (WHERE s."loginAt" >= ${week})  AS week,
             COUNT(DISTINCT s."userId") FILTER (WHERE s."loginAt" >= ${month}) AS month
        FROM "userLoginSession" s
        JOIN "userProfile" u ON u."id" = s."userId"
       WHERE u."userType" = 'STUDENT'
         AND s."loginAt" >= ${from}`,
    // Practice time, the same measure as the parent dashboard: seconds on each
    // question, plus English passage reading. Students only, so admins trying
    // a quiz do not count. VR's start time has no zone; it is written as UTC.
    prisma.$queryRaw<PracticeSeconds[]>`
      SELECT COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${today}), 0) AS today,
             COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${week}),  0) AS week,
             COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${month}), 0) AS month,
             COALESCE(SUM(t.secs), 0)                                     AS alltime
        FROM (
              SELECT m."testStartTime" AS started, q."timeSpentOnQuestion" AS secs, m."studentId"
                FROM "testTrackerEnglish" q JOIN "testTrackerEnglishMain" m ON m."id" = q."testId"
              UNION ALL
              SELECT m."testStartTime", m."passageReadSeconds", m."studentId"
                FROM "testTrackerEnglishMain" m
              UNION ALL
              SELECT m."testStartTime", q."timeSpentOnQuestion", m."studentId"
                FROM "testTrackerMath" q JOIN "testTrackerMathMain" m ON m."id" = q."testId"
              UNION ALL
              SELECT m."testStartTime" AT TIME ZONE 'UTC', q."timeSpentOnQuestion", m."studentId"
                FROM "testTrackerVR" q JOIN "testTrackerVRMain" m ON m."id" = q."testId"
              UNION ALL
              SELECT m."testStartTime", q."timeSpentOnQuestion", m."studentId"
                FROM "testTrackerNvr" q JOIN "testTrackerNvrMain" m ON m."id" = q."testId"
             ) t
        JOIN "userProfile" u ON u."id" = t."studentId"
       WHERE u."userType" = 'STUDENT'`,
  ]);

  const count = (type: string) =>
    byType.find((row) => row.userType === type)?._count._all ?? 0;
  const students = count("STUDENT");
  const parents = count("PARENT");
  const admins = count("ADMIN");
  const directors = count("PRODUCT_DIRECTOR");
  const n = (value: unknown) => Number(value) || 0;
  // Seconds to whole minutes.
  const minutes = (value: unknown) => Math.round(n(value) / 60);

  return {
    accounts: {
      students,
      parents,
      admins,
      directors,
      total: students + parents + admins + directors,
    },
    inactive,
    studentLogins: {
      today: n(logins[0]?.today),
      week: n(logins[0]?.week),
      month: n(logins[0]?.month),
    },
    practiceMinutes: {
      today: minutes(practice[0]?.today),
      week: minutes(practice[0]?.week),
      month: minutes(practice[0]?.month),
      allTime: minutes(practice[0]?.alltime),
    },
  };
}

/* ------------------------------------------------------------------ */
/* By country                                                          */
/* ------------------------------------------------------------------ */

export interface CountryStats {
  /** userProfile.countryCode, e.g. "GB"; null for accounts made before it was asked. */
  code: string | null;
  name: string;
  students: number;
  parents: number;
  studentLogins: { today: number; week: number; month: number };
  practiceMinutes: { month: number; allTime: number };
}

interface CountryRow {
  code: string | null;
  name: string | null;
  students: unknown;
  parents: unknown;
  login_today: unknown;
  login_week: unknown;
  login_month: unknown;
  secs_month: unknown;
  secs_alltime: unknown;
}

/**
 * The same figures per country, from userProfile.countryCode: student and
 * parent accounts, distinct students who logged in (UK periods), and minutes
 * practised. One row per country that has any account; accounts with no
 * country recorded form a "Not recorded" row. Most students first.
 */
export async function countryStats(): Promise<CountryStats[]> {
  const { today, week, month } = ukPeriodStarts();
  const from = week < month ? week : month;

  const rows = await prisma.$queryRaw<CountryRow[]>`
    WITH accounts AS (
      SELECT u."countryCode" AS code,
             COUNT(*) FILTER (WHERE u."userType" = 'STUDENT') AS students,
             COUNT(*) FILTER (WHERE u."userType" = 'PARENT')  AS parents
        FROM "userProfile" u
       GROUP BY u."countryCode"
    ),
    logins AS (
      SELECT u."countryCode" AS code,
             COUNT(DISTINCT s."userId") FILTER (WHERE s."loginAt" >= ${today}) AS login_today,
             COUNT(DISTINCT s."userId") FILTER (WHERE s."loginAt" >= ${week})  AS login_week,
             COUNT(DISTINCT s."userId") FILTER (WHERE s."loginAt" >= ${month}) AS login_month
        FROM "userLoginSession" s
        JOIN "userProfile" u ON u."id" = s."userId"
       WHERE u."userType" = 'STUDENT' AND s."loginAt" >= ${from}
       GROUP BY u."countryCode"
    ),
    practice AS (
      SELECT u."countryCode" AS code,
             COALESCE(SUM(t.secs) FILTER (WHERE t.started >= ${month}), 0) AS secs_month,
             COALESCE(SUM(t.secs), 0) AS secs_alltime
        FROM (
              SELECT m."testStartTime" AS started, q."timeSpentOnQuestion" AS secs, m."studentId"
                FROM "testTrackerEnglish" q JOIN "testTrackerEnglishMain" m ON m."id" = q."testId"
              UNION ALL
              SELECT m."testStartTime", m."passageReadSeconds", m."studentId"
                FROM "testTrackerEnglishMain" m
              UNION ALL
              SELECT m."testStartTime", q."timeSpentOnQuestion", m."studentId"
                FROM "testTrackerMath" q JOIN "testTrackerMathMain" m ON m."id" = q."testId"
              UNION ALL
              SELECT m."testStartTime" AT TIME ZONE 'UTC', q."timeSpentOnQuestion", m."studentId"
                FROM "testTrackerVR" q JOIN "testTrackerVRMain" m ON m."id" = q."testId"
              UNION ALL
              SELECT m."testStartTime", q."timeSpentOnQuestion", m."studentId"
                FROM "testTrackerNvr" q JOIN "testTrackerNvrMain" m ON m."id" = q."testId"
             ) t
        JOIN "userProfile" u ON u."id" = t."studentId"
       WHERE u."userType" = 'STUDENT'
       GROUP BY u."countryCode"
    )
    SELECT a.code, c."name", a.students, a.parents,
           l.login_today, l.login_week, l.login_month,
           p.secs_month, p.secs_alltime
      FROM accounts a
      LEFT JOIN "country"  c ON c."code" = a.code
      LEFT JOIN logins     l ON l.code IS NOT DISTINCT FROM a.code
      LEFT JOIN practice   p ON p.code IS NOT DISTINCT FROM a.code
     WHERE a.students > 0 OR a.parents > 0`;

  const n = (value: unknown) => Number(value) || 0;
  const minutes = (value: unknown) => Math.round(n(value) / 60);

  return rows
    .map((r) => ({
      code: r.code?.trim() || null,
      name: r.name ?? (r.code ? r.code.trim() : "Not recorded"),
      students: n(r.students),
      parents: n(r.parents),
      studentLogins: {
        today: n(r.login_today),
        week: n(r.login_week),
        month: n(r.login_month),
      },
      practiceMinutes: { month: minutes(r.secs_month), allTime: minutes(r.secs_alltime) },
    }))
    .sort((a, b) =>
      // "Not recorded" last; otherwise most students, then most parents, then A-Z.
      Number(a.code === null) - Number(b.code === null) ||
      b.students - a.students ||
      b.parents - a.parents ||
      a.name.localeCompare(b.name)
    );
}
