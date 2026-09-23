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
const ENTITLEMENT_LEVELS = [
  { level: "Starter", column: "starter" },
  { level: "Explorer", column: "explorer" },
  { level: "Challenger", column: "challenger" },
  { level: "Think Harder", column: "thinkHarder" },
] as const;

export type EntitlementColumn = (typeof ENTITLEMENT_LEVELS)[number]["column"];

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
    select: {
      starter: true,
      explorer: true,
      challenger: true,
      thinkHarder: true,
    },
  });
  if (!details) return [];

  return ENTITLEMENT_LEVELS.filter(
    (entry) => details[entry.column] === true
  ).map((entry) => entry.level);
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
 * Difficulty bands in teaching order. Anything an admin invents beyond these
 * is appended alphabetically rather than dropped.
 */
export const DIFFICULTY_ORDER = [
  "Starter",
  "Explorer",
  "Challenger",
  "Master",
] as const;

export const UNGRADED_LABEL = "Unrated";

export function sortDifficulties(levels: string[]): string[] {
  const known = DIFFICULTY_ORDER.map((d) => d.toLowerCase());
  const rank = (level: string) => {
    if (level === UNGRADED_LABEL) return Number.MAX_SAFE_INTEGER;
    const i = known.indexOf(level.toLowerCase());
    return i === -1 ? known.length : i;
  };

  return [...levels].sort((a, b) => {
    const diff = rank(a) - rank(b);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}

/** Styling per band, so the difficulty groups read at a glance. */
export function difficultyStyle(level: string): string {
  switch (level.toLowerCase()) {
    case "starter":
      return "bg-green-100 text-green-800 border-green-300";
    case "explorer":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "challenger":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "master":
      return "bg-rose-100 text-rose-800 border-rose-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export interface RecentAttempt {
  percentage: number;
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

/** Green / amber / red band for a score chip. */
export function scoreStyle(percentage: number): string {
  if (percentage >= 70) return "bg-green-100 text-green-800 border-green-300";
  if (percentage >= 40) return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-red-100 text-red-700 border-red-300";
}
