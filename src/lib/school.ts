import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  endAllSessions,
  getSessionOrThrow,
  hashPassword,
  type Session,
} from "@/lib/auth";
import { displayName } from "@/lib/english";
import { closeOpenSessions } from "@/lib/login-session";
import { normaliseProfileName, passwordProblem } from "@/lib/parent";
import { defaultEntitlementsForYear } from "@/lib/student";

/**
 * Schools, classes, teachers and classroom turns.
 *
 * A school's classes are the Years (Year 4, Year 5...). Everything a School
 * Admin or teacher may see or change is decided here, so the rule that
 * matters - staff only ever reach their own school, and a teacher only the
 * Years they take - lives in one place rather than being
 * re-derived on every page and route.
 */

export interface SchoolStaff {
  session: Session;
  userId: number;
  schoolId: bigint;
  role: "SCHOOL_ADMIN" | "TEACHER";
}

/**
 * The signed-in School Admin or teacher and their school. Throws
 * "Unauthorized" with no session and "Forbidden" for anyone else, including
 * staff of a school that has been switched off.
 */
export async function requireSchoolStaff(
  roles: SchoolStaff["role"][] = ["SCHOOL_ADMIN", "TEACHER"]
): Promise<SchoolStaff> {
  const session = await getSessionOrThrow();
  const role = session.userType;
  if (role !== "SCHOOL_ADMIN" && role !== "TEACHER") throw new Error("Forbidden");
  if (!roles.includes(role)) throw new Error("Forbidden");

  const row = await prisma.userProfile.findUnique({
    where: { id: session.userId },
    select: { schoolId: true, school: { select: { isActive: true } } },
  });
  if (!row?.schoolId || !row.school?.isActive) throw new Error("Forbidden");

  return { session, userId: session.userId, schoolId: row.schoolId, role };
}

/** The JSON answer for an error thrown by the guards above. */
export function guardStatus(error: unknown): { error: string; status: number } | null {
  if (!(error instanceof Error)) return null;
  if (error.message === "Unauthorized") return { error: "Unauthorized", status: 401 };
  if (error.message === "Forbidden") return { error: "Forbidden", status: 403 };
  return null;
}

/** Trimmed text up to `max` characters, or null when blank. */
export function text(value: unknown, max = 100): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

/** A positive whole-number id from a request body, or null. */
export function idFrom(value: unknown): bigint | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? BigInt(n) : null;
}

/* ------------------------------------------------------------------ */
/* Staff accounts                                                      */
/* ------------------------------------------------------------------ */

export interface StaffInput {
  fName: string;
  lName: string;
  profileName: string;
  /** Null only when editing and the password is left blank (unchanged). */
  password: string | null;
  email: string;
}

/**
 * A School Admin or teacher account from a form post, or the message to show.
 * The email is required: it is how staff reset a forgotten password.
 *
 * When editing, pass the account's own id: its current login ID does not
 * count as taken, and a blank password means "leave it as it is".
 */
export async function staffInputFrom(
  body: Record<string, unknown>,
  editingId?: bigint
): Promise<StaffInput | string> {
  const fName = text(body.fName);
  const lName = text(body.lName);
  if (!fName || !lName) return "First name and last name are required";

  const email = text(body.email, 254)?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address";
  }

  const profileName = normaliseProfileName(body.profileName);
  if (!profileName) {
    return "Login ID must be 3-30 characters, using letters, numbers, dot, dash or underscore";
  }

  const keepPassword = editingId !== undefined && !body.password && !body.confirmPassword;
  if (!keepPassword) {
    const problem = passwordProblem(body.password, body.confirmPassword);
    if (problem) return problem;
  }

  if (await loginIdTaken(profileName, editingId)) return "That login ID is already taken";

  return {
    fName,
    lName,
    profileName,
    password: keepPassword ? null : String(body.password),
    email,
  };
}

/** Whether another account already uses this login ID. */
async function loginIdTaken(profileName: string, exceptId?: bigint): Promise<boolean> {
  const taken = await prisma.userProfile.findUnique({
    where: { profileName },
    select: { id: true },
  });
  return taken !== null && taken.id !== exceptId;
}

/** The userProfile data for a new School Admin or teacher of `schoolId`. */
export async function staffAccountData(
  input: StaffInput,
  role: SchoolStaff["role"],
  schoolId: bigint,
  programmeCode: string
) {
  return {
    fName: input.fName,
    lName: input.lName,
    profileName: input.profileName,
    profilePassword: await hashPassword(input.password ?? ""),
    userType: role,
    isActive: true,
    schoolId,
    programmeCode,
    // Teachers open pupils on several classroom devices at once.
    allowMultipleSessions: role === "TEACHER",
    personalDetails: { create: { emailAddress: input.email } },
  };
}

/* ------------------------------------------------------------------ */
/* Years - a school's classes                                          */
/* ------------------------------------------------------------------ */

export interface YearRow {
  id: string;
  name: string;
  teachers: { id: number; name: string }[];
  studentCount: number;
}

/**
 * The Years this staff member works with: every Year for a School Admin, only
 * the Years they take for a teacher. Teachers and pupil counts are this
 * school's only.
 */
export async function listYears(staff: SchoolStaff): Promise<YearRow[]> {
  const rows = await prisma.year.findMany({
    where:
      staff.role === "TEACHER"
        ? { classTeachers: { some: { teacherId: BigInt(staff.userId), removedAt: null } } }
        : {},
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      classTeachers: {
        where: { schoolId: staff.schoolId, removedAt: null },
        select: { teacher: { select: { id: true, fName: true, mName: true, lName: true } } },
      },
      _count: {
        select: {
          studentDetails: {
            where: { student: { schoolId: staff.schoolId, isActive: true, userType: "STUDENT" } },
          },
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    teachers: r.classTeachers.map((t) => ({ id: Number(t.teacher.id), name: displayName(t.teacher) })),
    studentCount: r._count.studentDetails,
  }));
}

/**
 * The Year, if this staff member may add or open pupils in it: any Year for a
 * School Admin, a Year they take for a teacher. Null otherwise.
 */
export async function yearFor(staff: SchoolStaff, yearId: string | null) {
  if (!yearId) return null;
  return prisma.year.findFirst({
    where: {
      id: yearId,
      ...(staff.role === "TEACHER"
        ? { classTeachers: { some: { teacherId: BigInt(staff.userId), removedAt: null } } }
        : {}),
    },
    select: { id: true, name: true },
  });
}

/* ------------------------------------------------------------------ */
/* Pupils                                                              */
/* ------------------------------------------------------------------ */

export interface PupilRow {
  studentId: number;
  name: string;
  fName: string;
  lName: string;
  isActive: boolean;
  /** The username staff gave the pupil; null when one was made up. */
  username: string | null;
  yearId: string | null;
  yearName: string | null;
  /** Open on a classroom device right now. */
  inSession: boolean;
}

/**
 * This school's pupils in the given Years, by Year then name. Inactive pupils
 * are left out unless asked for - the edit lists show them, so they can be
 * switched back on.
 */
export async function listPupils(
  staff: SchoolStaff,
  yearIds: string[],
  { includeInactive = false } = {}
): Promise<PupilRow[]> {
  if (yearIds.length === 0) return [];
  const rows = await prisma.userStudentDetails.findMany({
    where: {
      studentYear: { in: yearIds },
      student: {
        schoolId: staff.schoolId,
        userType: "STUDENT",
        ...(includeInactive ? {} : { isActive: true }),
      },
    },
    select: {
      studentId: true,
      studentYear: true,
      year: { select: { name: true, order: true } },
      student: {
        select: {
          fName: true,
          mName: true,
          lName: true,
          profileName: true,
          isActive: true,
          classroomTurns: { where: { endedAt: null }, select: { id: true }, take: 1 },
        },
      },
    },
  });
  return rows
    .sort(
      (a, b) =>
        (a.year?.order ?? 0) - (b.year?.order ?? 0) ||
        displayName(a.student).localeCompare(displayName(b.student))
    )
    .map((r) => ({
      studentId: Number(r.studentId),
      name: displayName(r.student),
      fName: r.student.fName ?? "",
      lName: r.student.lName ?? "",
      isActive: r.student.isActive,
      username: r.student.profileName.startsWith(GENERATED_PREFIX) ? null : r.student.profileName,
      yearId: r.studentYear,
      yearName: r.year?.name ?? null,
      inSession: r.student.classroomTurns.length > 0,
    }));
}

/** Starts every login ID made up for a pupil who was given no username. */
const GENERATED_PREFIX = "pupil-";

/**
 * The login ID for a pupil given no username. Pupils sign in only through
 * their teacher, but profileName is required and unique.
 */
function pupilLoginId(schoolId: bigint): string {
  return `${GENERATED_PREFIX}${schoolId}-${randomBytes(5).toString("hex")}`;
}

/**
 * The username staff typed for a pupil: null when left blank (one is made
 * up), or the message to show when it cannot be used. When editing, pass the
 * pupil's id so their own current username does not count as taken.
 */
export async function pupilUsernameFrom(
  value: unknown,
  editingId?: bigint
): Promise<string | null | { error: string }> {
  if (typeof value !== "string" || !value.trim()) return null;
  const username = normaliseProfileName(value);
  if (!username || username.startsWith(GENERATED_PREFIX)) {
    return {
      error: "Username must be 3-30 characters, using letters, numbers, dot, dash or underscore",
    };
  }
  if (await loginIdTaken(username, editingId)) return { error: "That username is already taken" };
  return username;
}

/** Whether this login ID was made up rather than chosen by staff. */
export function isGeneratedLoginId(profileName: string): boolean {
  return profileName.startsWith(GENERATED_PREFIX);
}

/**
 * The login ID for a pupil whose username was cleared: their current one if
 * it was already made up, otherwise a new made-up one.
 */
export function generatedLoginIdFor(schoolId: bigint, current: string): string {
  return isGeneratedLoginId(current) ? current : pupilLoginId(schoolId);
}

/**
 * Throws "Seats" when the school already has as many active pupils as it has
 * seats - before adding a pupil or switching one back on.
 */
export async function requireFreeSeat(schoolId: bigint, maxStudents?: number | null) {
  const seats =
    maxStudents !== undefined
      ? maxStudents
      : (await prisma.school.findUnique({ where: { id: schoolId }, select: { maxStudents: true } }))
          ?.maxStudents ?? null;
  if (seats === null) return;
  const seated = await prisma.userProfile.count({
    where: { schoolId, userType: "STUDENT", isActive: true },
  });
  if (seated >= seats) throw new Error("Seats");
}

/**
 * Creates a pupil in a Year, with the username staff chose or a made-up one.
 * The password stays null, so the pupil can never sign in themselves - only
 * be opened by their teacher. Throws "Seats" when the school is full.
 */
export async function createPupil(
  staff: SchoolStaff,
  year: { id: string; name: string },
  name: { fName: string; lName: string },
  username: string | null
): Promise<number> {
  const school = await prisma.school.findUnique({
    where: { id: staff.schoolId },
    select: { programmeCode: true, maxStudents: true },
  });
  if (!school) throw new Error("Forbidden");
  await requireFreeSeat(staff.schoolId, school.maxStudents);

  const created = await prisma.userProfile.create({
    data: {
      fName: name.fName,
      lName: name.lName,
      profileName: username ?? pupilLoginId(staff.schoolId),
      profilePassword: null,
      userType: "STUDENT",
      isActive: true,
      schoolId: staff.schoolId,
      programmeCode: school.programmeCode,
      studentDetails: {
        create: {
          studentYear: year.id,
          ...defaultEntitlementsForYear(year.name),
        },
      },
    },
    select: { id: true },
  });
  return Number(created.id);
}

/**
 * The pupil's Year, if this staff member may open or manage the pupil. Null
 * for a pupil of another school or of a Year the teacher does not take, and
 * for an inactive pupil unless `includeInactive` (editing, to switch them
 * back on).
 */
export async function pupilFor(
  staff: SchoolStaff,
  studentId: bigint | null,
  { includeInactive = false } = {}
) {
  if (studentId === null) return null;
  const details = await prisma.userStudentDetails.findFirst({
    where: {
      studentId,
      student: {
        schoolId: staff.schoolId,
        userType: "STUDENT",
        ...(includeInactive ? {} : { isActive: true }),
      },
    },
    select: {
      studentYear: true,
      student: { select: { profileName: true, isActive: true } },
    },
  });
  if (!details) return null;
  return (await yearFor(staff, details.studentYear)) ? details : null;
}

/* ------------------------------------------------------------------ */
/* Classroom turns                                                     */
/* ------------------------------------------------------------------ */

/**
 * Ends one pupil's turn: closes the row and the login audit row, and ends the
 * pupil's session, so the device that held it is signed out on its next
 * request.
 */
export async function endClassroomTurn(
  classroomId: number,
  studentId: number,
  endReason: string
): Promise<void> {
  await prisma.classroomSession.updateMany({
    where: { id: BigInt(classroomId), endedAt: null },
    data: { endedAt: new Date(), endReason },
  });
  await closeOpenSessions(studentId, endReason);
  await endAllSessions(studentId);
}

/** Ends every turn this teacher has open: "end all" at the end of a lesson. */
export async function endTeacherTurns(teacherId: number): Promise<number> {
  const open = await prisma.classroomSession.findMany({
    where: { teacherId: BigInt(teacherId), endedAt: null },
    select: { id: true, studentId: true },
  });
  for (const turn of open) {
    await endClassroomTurn(Number(turn.id), Number(turn.studentId), "ended_by_teacher");
  }
  return open.length;
}
