import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/auth";

/**
 * The student whose data this session should see: themselves for a STUDENT,
 * their child for a PARENT, nobody for an admin or anonymous caller.
 *
 * A parent may now hold several children, and these subject pages still show
 * one child's work, so the eldest profile is used. Picking which child to view
 * belongs on the parent dashboard and is not wired up yet; until it is, a
 * parent with one child - which is every parent today - sees exactly what they
 * saw before.
 */
export async function resolveStudentId(
  session: Session | null
): Promise<number | null> {
  if (!session) return null;
  if (session.userType === "STUDENT") return session.userId;
  if (session.userType !== "PARENT") return null;

  const child = await prisma.userStudentDetails.findFirst({
    where: { parentId: session.userId },
    orderBy: { studentId: "asc" },
    select: { studentId: true },
  });
  return child?.studentId ?? null;
}

/**
 * Difficulty levels and the userStudentDetails flag that unlocks each one.
 * The flags are not subject-specific: a level unlocked here is unlocked for
 * English and Maths alike.
 */
export const ENTITLEMENT_LEVELS = [
  { level: "Starter", column: "starter" },
  { level: "Explorer", column: "explorer" },
  { level: "Navigator", column: "navigator" },
  { level: "Challenger", column: "challenger" },
  { level: "Master", column: "master" },
] as const;

// "Think Harder" left the ladder. Its column is still on the table, but no
// content carries the level and nothing grants it, so it is absent here on
// purpose - a level listed without a column behind it can never be granted,
// which is exactly how Navigator stayed invisible.

export type EntitlementColumn = (typeof ENTITLEMENT_LEVELS)[number]["column"];

/** Every entitlement flag set to false - the starting point for a grant. */
export type EntitlementFlags = Record<EntitlementColumn, boolean>;

const NO_LEVELS: EntitlementFlags = {
  starter: false,
  explorer: false,
  navigator: false,
  challenger: false,
  master: false,
};

/**
 * The difficulty levels a child is given when their account is created,
 * scaled to their school year:
 *
 *   Year 3 and below : Starter, Explorer
 *   Year 4           : + Navigator
 *   Year 5 and above : everything
 *
 * The harder rungs open as the child moves up, so a parent does not have to
 * grant them by hand. A parent can still adjust any of these from Kids Profile
 * afterwards. An unreadable or missing year falls back to Starter only, which
 * is the safe floor rather than opening everything.
 */
export function defaultEntitlementsForYear(
  yearName: string | null | undefined
): EntitlementFlags {
  const year = yearName ? parseInt(yearName.replace(/[^0-9]/g, ""), 10) : NaN;

  if (!Number.isFinite(year)) return { ...NO_LEVELS, starter: true };
  if (year >= 5) {
    return {
      starter: true,
      explorer: true,
      navigator: true,
      challenger: true,
      master: true,
    };
  }
  if (year === 4) {
    return { ...NO_LEVELS, starter: true, explorer: true, navigator: true };
  }
  // Year 3 and below.
  return { ...NO_LEVELS, starter: true, explorer: true };
}

/** The flag that unlocks a level, or null when the level has no flag. */
export function entitlementColumnFor(level: string): EntitlementColumn | null {
  const key = level.toLowerCase().replace(/\s+/g, "");
  const match = ENTITLEMENT_LEVELS.find(
    (entry) => entry.level.toLowerCase().replace(/\s+/g, "") === key
  );
  return match?.column ?? null;
}

/** Admins are not gated; everyone else is limited to their granted levels. */
export type LevelAccess = "all" | string[];

export async function allowedLevels(
  session: Session | null
): Promise<LevelAccess> {
  if (session?.userType === "ADMIN") return "all";

  const studentId = await resolveStudentId(session);
  if (studentId === null) return [];

  const details = await prisma.userStudentDetails.findUnique({
    where: { studentId },
    // One column per rung in ENTITLEMENT_LEVELS. A rung missing from this
    // select is a rung nobody can ever be granted, which is how Navigator
    // stayed invisible despite having content.
    select: {
      starter: true,
      explorer: true,
      navigator: true,
      challenger: true,
      master: true,
    },
  });
  if (!details) return [];

  return grantedLevels(details);
}

/** The ladder rungs these flags unlock, in ladder order. */
export function grantedLevels(
  flags: Partial<Record<EntitlementColumn, boolean | null>>
): string[] {
  return ENTITLEMENT_LEVELS.filter((entry) => flags[entry.column] === true).map(
    (entry) => entry.level
  );
}

/**
 * A level with no flag - including a comprehension left unrated - stays locked
 * for students. Safer than opening new content to everyone by default.
 */
export function canAccessLevel(
  access: LevelAccess,
  level: string | null | undefined
): boolean {
  if (access === "all") return true;
  if (!level) return false;
  return access.some((l) => l.toLowerCase() === level.toLowerCase());
}

/**
 * The one difficulty ladder, in teaching order, shared by every subject. It is
 * closed: content carrying any other level is not shown, and the admin APIs
 * refuse to save one.
 */
export const DIFFICULTY_ORDER = [
  "Starter",
  "Explorer",
  "Navigator",
  "Challenger",
  "Master",
] as const;

export type DifficultyLevel = (typeof DIFFICULTY_ORDER)[number];

/** The ladder's spelling of `level`, or null when it is not on the ladder. */
export function canonicalLevel(
  level: string | null | undefined
): DifficultyLevel | null {
  const wanted = level?.trim().toLowerCase();
  return DIFFICULTY_ORDER.find((d) => d.toLowerCase() === wanted) ?? null;
}

/** The ladder rungs among `levels`, in ladder order; anything else is dropped. */
export function sortDifficulties(
  levels: (string | null | undefined)[]
): DifficultyLevel[] {
  const present = new Set(levels.map(canonicalLevel));
  return DIFFICULTY_ORDER.filter((d) => present.has(d));
}

/**
 * Re-exported from level-style.ts, which holds no Prisma import so a client
 * component can pull the same colours without bundling the database client.
 */
export { difficultyStyle, scoreStyle } from "@/lib/level-style";

/** One past round's score, with the id its review page is opened by. */
export interface TestScore {
  testId: number;
  percentage: number;
}

export interface RecentAttempt extends TestScore {
  submittedAt: Date;
}

/**
 * The viewer's three most recent attempts at each of `compIds`, newest first.
 * One query for every comprehension on the page rather than one per card.
 *
 * Read from testTrackerEnglishMain, which is the record of an English round.
 * Migration 012 carried every earlier attempt in, so nothing a student sat
 * before the tracker existed drops off these cards.
 *
 * The score is counted from the question rows rather than stored on the round,
 * so a total can never drift from the answers it is meant to summarise.
 */
export async function recentAttemptsByComp(
  userId: number,
  compIds: number[]
): Promise<Map<number, RecentAttempt[]>> {
  const byComp = new Map<number, RecentAttempt[]>();
  if (compIds.length === 0) return byComp;

  const tests = await prisma.testTrackerEnglishMain.findMany({
    where: { studentId: userId, gsEngCompId: { in: compIds } },
    select: {
      id: true,
      gsEngCompId: true,
      testStartTime: true,
      // Only the flag is needed; the rest of the round stays on the server.
      questions: { select: { isAnsRight: true } },
    },
    orderBy: { testStartTime: "desc" },
  });

  for (const test of tests) {
    const bucket = byComp.get(test.gsEngCompId) ?? [];
    // Already newest-first, so the first three seen are the ones we want.
    if (bucket.length < 3) {
      const total = test.questions.length;
      const correct = test.questions.filter((q) => q.isAnsRight).length;
      bucket.push({
        testId: test.id,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
        // Rounds carried in by 012 hold the old submission time here; live
        // ones hold the start time. Both render as the same date on the chip.
        submittedAt: test.testStartTime,
      });
      byComp.set(test.gsEngCompId, bucket);
    }
  }

  return byComp;
}
