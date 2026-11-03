import { describe, expect, it } from "vitest";
import { getSession, verifyToken } from "@/lib/auth";
import { guardStatus, listPupils, listYears, pupilFor, requireSchoolStaff, yearFor } from "@/lib/school";
import { POST as openPupil } from "@/app/api/teacher/open/route";
import { PATCH as editPupil, POST as addPupil } from "@/app/api/school/pupils/route";
import { db, insert } from "../support/fake-prisma";
import { ID, account, details, forgetCachedSessions, jsonRequest, signInAs } from "../support/world";

const staffAs = async (id: number) => {
  signInAs(id);
  return requireSchoolStaff();
};
const ids = (rows: { studentId: number }[]) => rows.map((r) => r.studentId).sort();

describe("requireSchoolStaff", () => {
  it("answers 401 with no session", async () => {
    const error = await requireSchoolStaff().catch((e) => e);
    expect(guardStatus(error)).toEqual({ error: "Unauthorized", status: 401 });
  });

  it.each([
    ["a parent", ID.parent],
    ["a pupil", ID.oakPupil],
    ["a site admin", ID.admin],
  ])("answers 403 to %s", async (_who, id) => {
    signInAs(id);
    const error = await requireSchoolStaff().catch((e) => e);
    expect(guardStatus(error)).toEqual({ error: "Forbidden", status: 403 });
  });

  it("refuses a teacher where only a School Admin may go", async () => {
    signInAs(ID.oakTeacher);
    await expect(requireSchoolStaff(["SCHOOL_ADMIN"])).rejects.toThrow("Forbidden");
  });

  it("takes the school from the account, not from anything the caller sends", async () => {
    expect((await staffAs(ID.oakTeacher)).schoolId).toBe(BigInt(1));
    expect((await staffAs(ID.birchTeacher)).schoolId).toBe(BigInt(2));
  });
});

describe("switching a school off", () => {
  it("shuts out its staff", async () => {
    signInAs(ID.closedTeacher);
    await expect(requireSchoolStaff()).rejects.toThrow("Unauthorized");
  });

  it("ends the sessions of its staff and pupils already signed in", async () => {
    signInAs(ID.oakPupil);
    expect(await getSession()).not.toBeNull();

    db.school.find((s) => s.id === BigInt(1))!.isActive = false;
    forgetCachedSessions();
    expect(await getSession()).toBeNull();
  });
});

describe("pupilFor", () => {
  it("gives a School Admin any pupil of their school, whatever the Year", async () => {
    const staff = await staffAs(ID.oakAdmin);
    expect(await pupilFor(staff, BigInt(ID.oakPupil))).not.toBeNull();
    expect(await pupilFor(staff, BigInt(ID.oakYear4Pupil))).not.toBeNull();
  });

  it("gives a teacher the pupils of the Years they take", async () => {
    const staff = await staffAs(ID.oakTeacher);
    expect(await pupilFor(staff, BigInt(ID.oakPupil))).not.toBeNull();
  });

  it("hides a pupil in a Year the teacher was taken off", async () => {
    const staff = await staffAs(ID.oakTeacher);
    expect(await pupilFor(staff, BigInt(ID.oakYear4Pupil))).toBeNull();
  });

  it.each([
    ["a School Admin", ID.oakAdmin],
    ["a teacher who takes the same Year elsewhere", ID.oakTeacher],
  ])("hides another school's pupil from %s", async (_who, id) => {
    const staff = await staffAs(id);
    expect(await pupilFor(staff, BigInt(ID.birchPupil))).toBeNull();
  });

  it("hides a home child who belongs to no school", async () => {
    const staff = await staffAs(ID.oakAdmin);
    expect(await pupilFor(staff, BigInt(ID.homeChild))).toBeNull();
  });

  it("does not treat a staff account as a pupil, even with a student record", async () => {
    insert("userStudentDetails", { studentId: BigInt(ID.oakTeacher), parentId: null, studentYear: "y5" });
    const staff = await staffAs(ID.oakAdmin);
    expect(await pupilFor(staff, BigInt(ID.oakTeacher))).toBeNull();
  });

  it("shows an inactive pupil only when asked to", async () => {
    const staff = await staffAs(ID.oakTeacher);
    expect(await pupilFor(staff, BigInt(ID.oakInactivePupil))).toBeNull();
    expect(await pupilFor(staff, BigInt(ID.oakInactivePupil), { includeInactive: true })).not.toBeNull();
  });

  it("finds nobody for a missing id", async () => {
    const staff = await staffAs(ID.oakAdmin);
    expect(await pupilFor(staff, null)).toBeNull();
  });
});

describe("the class lists", () => {
  it("gives a teacher only the Years they still take", async () => {
    const staff = await staffAs(ID.oakTeacher);
    expect((await listYears(staff)).map((y) => y.id)).toEqual(["y5"]);
  });

  it("gives a School Admin every Year", async () => {
    const staff = await staffAs(ID.oakAdmin);
    expect((await listYears(staff)).map((y) => y.id).sort()).toEqual(["y4", "y5", "y6"]);
  });

  it("names and counts only this school's teachers and active pupils", async () => {
    const staff = await staffAs(ID.oakTeacher);
    const [year5] = await listYears(staff);
    expect(year5.teachers.map((t) => t.id)).toEqual([ID.oakTeacher]);
    expect(year5.studentCount).toBe(2);
  });

  it("lists only this school's active pupils", async () => {
    const staff = await staffAs(ID.oakTeacher);
    expect(ids(await listPupils(staff, ["y5"]))).toEqual([ID.oakPupil, ID.linkedPupil].sort());
  });

  it("adds inactive pupils only when asked to", async () => {
    const staff = await staffAs(ID.oakTeacher);
    const rows = await listPupils(staff, ["y5"], { includeInactive: true });
    expect(ids(rows)).toEqual([ID.oakPupil, ID.oakInactivePupil, ID.linkedPupil].sort());
  });

  it("keeps a teacher's list to their Years, as the pages build it", async () => {
    const staff = await staffAs(ID.oakTeacher);
    const years = await listYears(staff);
    const rows = await listPupils(staff, years.map((y) => y.id));
    expect(ids(rows)).not.toContain(ID.oakYear4Pupil);
  });

  it("refuses a teacher a Year they do not take, but not a School Admin", async () => {
    expect(await yearFor(await staffAs(ID.oakTeacher), "y4")).toBeNull();
    expect(await yearFor(await staffAs(ID.oakAdmin), "y4")).not.toBeNull();
  });
});

describe("opening a pupil on a classroom device", () => {
  const open = (studentId: unknown) => openPupil(jsonRequest("/api/teacher/open", { studentId }));

  it("hands the device to a pupil in the teacher's Year", async () => {
    signInAs(ID.oakTeacher);
    const response = await open(ID.oakPupil);
    expect(response.status).toBe(200);

    const session = verifyToken(response.cookies.get("token")!.value)!;
    expect(session).toMatchObject({ userId: ID.oakPupil, userType: "STUDENT", teacherId: ID.oakTeacher });
    expect(db.classroomSession).toHaveLength(1);
  });

  it.each([
    ["another school's pupil", ID.birchPupil],
    ["a pupil in a Year they were taken off", ID.oakYear4Pupil],
    ["an inactive pupil", ID.oakInactivePupil],
    ["a home child", ID.homeChild],
  ])("refuses %s and issues no token", async (_who, studentId) => {
    signInAs(ID.oakTeacher);
    const response = await open(studentId);
    expect(response.status).toBe(403);
    expect(response.cookies.get("token")).toBeUndefined();
    expect(db.classroomSession).toHaveLength(0);
  });

  it("is for teachers only", async () => {
    signInAs(ID.oakAdmin);
    expect((await open(ID.oakPupil)).status).toBe(403);
    signInAs(ID.parent);
    expect((await open(ID.linkedPupil)).status).toBe(403);
  });

  it("needs a session", async () => {
    expect((await open(ID.oakPupil)).status).toBe(401);
  });
});

describe("adding and editing pupils", () => {
  const edit = { fName: "New", lName: "Name", yearId: "y6" };

  it("puts a new pupil in the staff member's school with no password", async () => {
    signInAs(ID.oakTeacher);
    const response = await addPupil(
      jsonRequest("/api/school/pupils", { fName: "A", lName: "B", yearId: "y5", schoolId: 2, password: "letmein" })
    );
    expect(response.status).toBe(201);

    const { studentId } = await response.json();
    expect(account(studentId)).toMatchObject({ schoolId: BigInt(1), profilePassword: null, userType: "STUDENT" });
  });

  it("refuses to add a pupil to a Year the teacher does not take", async () => {
    signInAs(ID.oakTeacher);
    const before = db.userProfile.length;
    const response = await addPupil(jsonRequest("/api/school/pupils", { fName: "A", lName: "B", yearId: "y4" }));
    expect(response.status).toBe(400);
    expect(db.userProfile).toHaveLength(before);
  });

  it.each([
    ["a School Admin, another school's pupil", ID.birchAdmin, ID.oakPupil],
    ["a teacher, another school's pupil", ID.oakTeacher, ID.birchPupil],
    ["a teacher, a Year they do not take", ID.oakTeacher, ID.oakYear4Pupil],
    ["a School Admin, a home child", ID.oakAdmin, ID.homeChild],
  ])("refuses an edit by %s and changes nothing", async (_who, staffId, studentId) => {
    signInAs(staffId);
    const name = account(studentId).fName;
    const response = await editPupil(jsonRequest("/api/school/pupils", { ...edit, studentId }, "PATCH"));
    expect(response.status).toBe(404);
    expect(account(studentId).fName).toBe(name);
  });

  it("lets a teacher edit their pupil and move them to any Year", async () => {
    signInAs(ID.oakTeacher);
    const response = await editPupil(
      jsonRequest("/api/school/pupils", { ...edit, studentId: ID.oakPupil }, "PATCH")
    );
    expect(response.status).toBe(200);
    expect(account(ID.oakPupil).fName).toBe("New");
    expect(details(ID.oakPupil).studentYear).toBe("y6");
  });

  it("does not touch the password when editing", async () => {
    account(ID.linkedPupil).profilePassword = "existing-hash";
    signInAs(ID.oakAdmin);
    await editPupil(jsonRequest("/api/school/pupils", { ...edit, studentId: ID.linkedPupil, password: "x" }, "PATCH"));
    expect(account(ID.linkedPupil).profilePassword).toBe("existing-hash");
  });
});
