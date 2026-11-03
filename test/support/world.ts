import { NextRequest } from "next/server";
import { clearDb, db, insert, type Row } from "./fake-prisma";
import { jar } from "./fake-headers";
import { signToken, type UserType } from "@/lib/auth";

/**
 * The same small world for every test:
 *
 *   Oakwood     admin, teacher (takes Year 5; was taken off Year 4), pupils
 *   Birchwood   admin, teacher (also takes Year 5), one Year 5 pupil
 *   Closed      a switched-off school with a teacher and a pupil
 *   Parents     one with a home child and a linked Oakwood pupil, one with
 *               another home child, one with no children, one inactive
 */
export const ID = {
  admin: 1,
  oakAdmin: 10,
  oakTeacher: 11,
  birchAdmin: 20,
  birchTeacher: 21,
  closedTeacher: 31,
  parent: 50,
  otherParent: 51,
  freeParent: 52,
  inactiveParent: 53,
  oakPupil: 110,
  oakYear4Pupil: 111,
  oakInactivePupil: 112,
  linkedPupil: 113,
  birchPupil: 120,
  closedPupil: 130,
  homeChild: 150,
  otherHomeChild: 151,
} as const;

const SCHOOL = { oak: BigInt(1), birch: BigInt(2), closed: BigInt(3) };

function user(id: number, userType: UserType, profileName: string, extra: Row = {}) {
  insert("userProfile", {
    id: BigInt(id),
    profileName,
    userType,
    fName: profileName,
    lName: "Test",
    profilePassword: null,
    programmeCode: "GRAMMAR",
    isActive: true,
    schoolId: null,
    allowMultipleSessions: userType === "TEACHER",
    activeSessionKey: `sid-${id}`,
    ...extra,
  });
}

function pupil(id: number, profileName: string, yearId: string, extra: Row = {}, parentId: number | null = null) {
  user(id, "STUDENT", profileName, extra);
  insert("userStudentDetails", {
    studentId: BigInt(id),
    parentId: parentId === null ? null : BigInt(parentId),
    studentYear: yearId,
    starter: true,
    explorer: true,
    navigator: false,
    challenger: false,
    master: false,
  });
}

export function buildWorld() {
  clearDb();

  insert("school", { id: SCHOOL.oak, name: "Oakwood", isActive: true, programmeCode: "GRAMMAR", maxStudents: null });
  insert("school", { id: SCHOOL.birch, name: "Birchwood", isActive: true, programmeCode: "GRAMMAR", maxStudents: null });
  insert("school", { id: SCHOOL.closed, name: "Closed", isActive: false, programmeCode: "GRAMMAR", maxStudents: null });

  insert("year", { id: "y4", name: "Year 4", order: 4 });
  insert("year", { id: "y5", name: "Year 5", order: 5 });
  insert("year", { id: "y6", name: "Year 6", order: 6 });

  user(ID.admin, "ADMIN", "site.admin");
  user(ID.oakAdmin, "SCHOOL_ADMIN", "oak.admin", { schoolId: SCHOOL.oak });
  user(ID.oakTeacher, "TEACHER", "oak.teacher", { schoolId: SCHOOL.oak });
  user(ID.birchAdmin, "SCHOOL_ADMIN", "birch.admin", { schoolId: SCHOOL.birch });
  user(ID.birchTeacher, "TEACHER", "birch.teacher", { schoolId: SCHOOL.birch });
  user(ID.closedTeacher, "TEACHER", "closed.teacher", { schoolId: SCHOOL.closed });

  user(ID.parent, "PARENT", "the.parent");
  user(ID.otherParent, "PARENT", "other.parent");
  user(ID.freeParent, "PARENT", "free.parent");
  user(ID.inactiveParent, "PARENT", "gone.parent", { isActive: false });

  insert("userPersonalDetails", { userProfileId: BigInt(ID.freeParent), emailAddress: "Free@Example.com" });
  insert("userPersonalDetails", { userProfileId: BigInt(ID.inactiveParent), emailAddress: "gone@example.com" });
  insert("userPersonalDetails", { userProfileId: BigInt(ID.oakTeacher), emailAddress: "teacher@example.com" });

  insert("schoolClassTeacher", { schoolId: SCHOOL.oak, classId: "y5", teacherId: BigInt(ID.oakTeacher), removedAt: null });
  insert("schoolClassTeacher", { schoolId: SCHOOL.oak, classId: "y4", teacherId: BigInt(ID.oakTeacher), removedAt: new Date("2026-01-01") });
  insert("schoolClassTeacher", { schoolId: SCHOOL.birch, classId: "y5", teacherId: BigInt(ID.birchTeacher), removedAt: null });
  insert("schoolClassTeacher", { schoolId: SCHOOL.closed, classId: "y5", teacherId: BigInt(ID.closedTeacher), removedAt: null });

  pupil(ID.oakPupil, "oak.pupil", "y5", { schoolId: SCHOOL.oak });
  pupil(ID.oakYear4Pupil, "oak.year4", "y4", { schoolId: SCHOOL.oak });
  pupil(ID.oakInactivePupil, "oak.inactive", "y5", { schoolId: SCHOOL.oak, isActive: false });
  pupil(ID.linkedPupil, "oak.linked", "y5", { schoolId: SCHOOL.oak }, ID.parent);
  pupil(ID.birchPupil, "birch.pupil", "y5", { schoolId: SCHOOL.birch });
  pupil(ID.closedPupil, "closed.pupil", "y5", { schoolId: SCHOOL.closed });
  pupil(ID.homeChild, "home.child", "y5", {}, ID.parent);
  pupil(ID.otherHomeChild, "other.child", "y5", {}, ID.otherParent);
}

export const account = (id: number) => db.userProfile.find((u) => u.id === BigInt(id))!;
export const details = (id: number) => db.userStudentDetails.find((d) => d.studentId === BigInt(id))!;

/** This browser is now signed in as the account, with its current session key. */
export function signInAs(id: number) {
  const row = account(id);
  jar.set(
    "token",
    signToken({
      userId: id,
      profileName: row.profileName,
      userType: row.userType,
      programme: row.programmeCode,
      sid: row.allowMultipleSessions ? undefined : row.activeSessionKey,
    })
  );
}

export function signOut() {
  jar.delete("token");
}

/**
 * Forgets the session checks auth.ts caches for 30 seconds, so a change made
 * directly to the world (a school switched off) is noticed at once.
 */
export function forgetCachedSessions() {
  (globalThis as unknown as { __sessionKeys?: Map<number, unknown> }).__sessionKeys?.clear();
}

export function jsonRequest(path: string, body: unknown, method = "POST") {
  return new NextRequest(`http://test.local${path}`, { method, body: JSON.stringify(body) });
}

export function formRequest(path: string, fields: Record<string, string>) {
  return new NextRequest(`http://test.local${path}`, { method: "POST", body: new URLSearchParams(fields) });
}

export const paramsFor = (studentId: number | string) => ({
  params: Promise.resolve({ studentId: String(studentId) }),
});
