import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { grantedLevels } from "@/lib/student";

/**
 * A parent's view of one of their children.
 *
 * Everything a parent is shown about a child is assembled here, so the one
 * rule that matters - a parent sees only their own children - lives in one
 * place rather than being re-derived on every page.
 */
export interface Child {
  studentId: number;
  name: string;
  /** The child's login id. */
  profileName: string;
  yearName: string | null;
  yearId: string | null;
  isActive: boolean;
  /** Difficulty levels unlocked for this child. */
  levels: string[];
}

/** Children of this parent, oldest profile first so the order never shifts. */
export async function listChildren(parentId: number): Promise<Child[]> {
  const rows = await prisma.userStudentDetails.findMany({
    where: { parentId },
    orderBy: { studentId: "asc" },
    select: {
      studentId: true,
      studentYear: true,
      starter: true,
      explorer: true,
      navigator: true,
      challenger: true,
      master: true,
      year: { select: { name: true } },
      student: {
        select: {
          fName: true,
          mName: true,
          lName: true,
          profileName: true,
          isActive: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    studentId: row.studentId,
    name: displayName(row.student),
    profileName: row.student.profileName,
    yearName: row.year?.name ?? null,
    yearId: row.studentYear,
    isActive: row.student.isActive,
    // Shared with the student-side gate, so the chips a parent sees and the
    // levels a child can actually open can never drift apart.
    levels: grantedLevels(row),
  }));
}

/**
 * True only if `studentId` is a child of this parent.
 *
 * Every write a parent makes to a child goes through here first. Without it,
 * changing the id in a form post would let one parent edit another's child.
 */
export async function ownsChild(
  parentId: number,
  studentId: number
): Promise<boolean> {
  if (!Number.isInteger(studentId)) return false;
  const found = await prisma.userStudentDetails.findFirst({
    where: { parentId, studentId },
    select: { id: true },
  });
  return found !== null;
}

/** The school years a child can be put in, in teaching order. */
export async function listYears() {
  return prisma.year.findMany({
    select: { id: true, name: true },
    orderBy: { order: "asc" },
  });
}

/** The parent's own details, for the My Profile screen. */
export async function parentProfile(parentId: number) {
  return prisma.userProfile.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      fName: true,
      mName: true,
      lName: true,
      profileName: true,
      personalDetails: {
        select: {
          userAdd1: true,
          userAdd2: true,
          userAdd3: true,
          userCity: true,
          userCounty: true,
          userZipCode: true,
          contactNumber1: true,
          contactNumber2: true,
          emailAddress: true,
        },
      },
    },
  });
}

export function isParent(session: Session | null): boolean {
  return session?.userType === "PARENT";
}

/** Shared by signup and by a parent creating a child. */
export function passwordProblem(
  password: unknown,
  confirmPassword: unknown
): string | null {
  if (typeof password !== "string" || password.length < 6) {
    return "Password must be at least 6 characters";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
}

/** Login ids are compared case-insensitively, so "RV" cannot shadow "rv". */
export function normaliseProfileName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return /^[a-z0-9._-]{3,30}$/.test(trimmed) ? trimmed : null;
}
