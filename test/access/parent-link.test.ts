import { describe, expect, it } from "vitest";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { ownsChild } from "@/lib/parent";
import { POST as linkRoute } from "@/app/api/school/pupils/parent/route";
import { POST as setHomePassword } from "@/app/api/parent/kids/[studentId]/password/route";
import { POST as login } from "@/app/api/auth/login/route";
import { db, insert } from "../support/fake-prisma";
import { jar } from "../support/fake-headers";
import { ID, account, details, jsonRequest, paramsFor, signInAs, signOut } from "../support/world";

const link = (body: Record<string, unknown>) => linkRoute(jsonRequest("/api/school/pupils/parent", body));
const linkFree = (studentId: number) =>
  link({ studentId, parentLoginId: "free.parent", parentEmail: "free@example.com" });
const logIn = (profileName: string, password: string) =>
  login(jsonRequest("/api/auth/login", { profileName, password }));

describe("linking a parent to a pupil", () => {
  it("needs the login ID and email to match, ignoring case", async () => {
    signInAs(ID.oakTeacher);
    const response = await link({
      studentId: ID.oakPupil,
      parentLoginId: "FREE.Parent",
      parentEmail: "FREE@example.com",
    });
    expect(response.status).toBe(200);
    expect(details(ID.oakPupil).parentId).toBe(BigInt(ID.freeParent));
    expect(await ownsChild(ID.freeParent, ID.oakPupil)).toBe(true);
  });

  it.each([
    ["the wrong email", { parentLoginId: "free.parent", parentEmail: "someone@example.com" }],
    ["the wrong login ID", { parentLoginId: "other.parent", parentEmail: "free@example.com" }],
    ["an inactive parent", { parentLoginId: "gone.parent", parentEmail: "gone@example.com" }],
    ["an account that is not a parent", { parentLoginId: "oak.teacher", parentEmail: "teacher@example.com" }],
  ])("refuses %s, with one message for every mismatch", async (_why, fields) => {
    signInAs(ID.oakTeacher);
    const response = await link({ studentId: ID.oakPupil, ...fields });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("No parent account matches that login ID and email");
    expect(details(ID.oakPupil).parentId).toBeNull();
  });

  it("needs both the login ID and the email", async () => {
    signInAs(ID.oakTeacher);
    expect((await link({ studentId: ID.oakPupil, parentLoginId: "free.parent" })).status).toBe(400);
    expect((await link({ studentId: ID.oakPupil, parentEmail: "free@example.com" })).status).toBe(400);
    expect(details(ID.oakPupil).parentId).toBeNull();
  });

  it("will not replace a parent already linked", async () => {
    signInAs(ID.oakTeacher);
    expect((await linkFree(ID.linkedPupil)).status).toBe(400);
    expect(details(ID.linkedPupil).parentId).toBe(BigInt(ID.parent));
  });

  it.each([
    ["another school's pupil", ID.oakTeacher, ID.birchPupil],
    ["a pupil in a Year they do not take", ID.oakTeacher, ID.oakYear4Pupil],
    ["a home child", ID.oakAdmin, ID.homeChild],
  ])("refuses %s", async (_who, staffId, studentId) => {
    signInAs(staffId);
    const before = details(studentId).parentId;
    expect((await linkFree(studentId)).status).toBe(404);
    expect(details(studentId).parentId).toBe(before);
  });

  it("is for school staff only", async () => {
    signInAs(ID.freeParent);
    expect((await linkFree(ID.oakPupil)).status).toBe(403);
    signInAs(ID.admin);
    expect((await linkFree(ID.oakPupil)).status).toBe(403);
    expect(details(ID.oakPupil).parentId).toBeNull();
  });

  it("needs a session", async () => {
    expect((await linkFree(ID.oakPupil)).status).toBe(401);
  });

  it("stops a member of staff guessing parents after 20 tries", async () => {
    signInAs(ID.oakTeacher);
    const guess = () =>
      link({ studentId: ID.oakPupil, parentLoginId: "free.parent", parentEmail: "guess@example.com" });
    for (let tries = 0; tries < 20; tries += 1) {
      expect((await guess()).status).toBe(400);
    }
    expect((await guess()).status).toBe(429);
  });
});

describe("unlinking a parent from a pupil", () => {
  const unlink = (studentId: number) => link({ studentId, unlink: true });

  it("takes the pupil away from the parent and clears the home password", async () => {
    account(ID.linkedPupil).profilePassword = await hashPassword("home-password");
    signInAs(ID.oakTeacher);

    expect((await unlink(ID.linkedPupil)).status).toBe(200);
    expect(details(ID.linkedPupil).parentId).toBeNull();
    expect(account(ID.linkedPupil).profilePassword).toBeNull();
    expect(await ownsChild(ID.parent, ID.linkedPupil)).toBe(false);
  });

  it("stops the old parent logging in as the pupil", async () => {
    account(ID.linkedPupil).profilePassword = await hashPassword("home-password");
    expect((await logIn("oak.linked", "home-password")).status).toBe(200);

    signInAs(ID.oakTeacher);
    await unlink(ID.linkedPupil);
    expect((await logIn("oak.linked", "home-password")).status).toBe(401);
  });

  it("ends a home session the pupil has open", async () => {
    signInAs(ID.linkedPupil);
    const homeToken = jar.get("token")!;
    expect(await getSession()).not.toBeNull();

    signInAs(ID.oakTeacher);
    await unlink(ID.linkedPupil);
    expect(account(ID.linkedPupil).activeSessionKey).toBeNull();

    jar.set("token", homeToken);
    expect(await getSession()).toBeNull();
  });

  it("leaves a lesson in progress alone", async () => {
    insert("classroomSession", {
      studentId: BigInt(ID.linkedPupil),
      teacherId: BigInt(ID.oakTeacher),
      endedAt: null,
    });
    const key = account(ID.linkedPupil).activeSessionKey;

    signInAs(ID.oakTeacher);
    await unlink(ID.linkedPupil);
    expect(account(ID.linkedPupil).activeSessionKey).toBe(key);
    expect(db.classroomSession[0].endedAt).toBeNull();
  });

  it("is refused for another school's pupil and changes nothing", async () => {
    details(ID.birchPupil).parentId = BigInt(ID.otherParent);
    account(ID.birchPupil).profilePassword = "existing-hash";
    signInAs(ID.oakAdmin);

    expect((await unlink(ID.birchPupil)).status).toBe(404);
    expect(details(ID.birchPupil).parentId).toBe(BigInt(ID.otherParent));
    expect(account(ID.birchPupil).profilePassword).toBe("existing-hash");
  });

  it("cannot be done by the parent", async () => {
    signInAs(ID.parent);
    expect((await unlink(ID.linkedPupil)).status).toBe(403);
    expect(details(ID.linkedPupil).parentId).toBe(BigInt(ID.parent));
  });
});

describe("a parent setting a pupil's home password", () => {
  const set = (studentId: number | string, password = "home-password", confirmPassword = password) =>
    setHomePassword(
      jsonRequest(`/api/parent/kids/${studentId}/password`, { password, confirmPassword }),
      paramsFor(studentId)
    );

  it("stores it hashed, and the pupil can then log in", async () => {
    signInAs(ID.parent);
    expect((await set(ID.linkedPupil)).status).toBe(200);

    const stored = account(ID.linkedPupil).profilePassword;
    expect(stored).not.toBe("home-password");
    expect(await verifyPassword("home-password", stored)).toBe(true);

    signOut();
    expect((await logIn("oak.linked", "home-password")).status).toBe(200);
  });

  it("ends the pupil's sessions and any classroom turn", async () => {
    insert("classroomSession", {
      studentId: BigInt(ID.linkedPupil),
      teacherId: BigInt(ID.oakTeacher),
      endedAt: null,
    });
    signInAs(ID.parent);
    await set(ID.linkedPupil);

    expect(account(ID.linkedPupil).activeSessionKey).toBeNull();
    expect(db.classroomSession[0]).toMatchObject({ endReason: "password_changed" });
    expect(db.classroomSession[0].endedAt).toBeInstanceOf(Date);
  });

  it.each([
    ["another parent's child", ID.otherHomeChild],
    ["a school pupil not linked to them", ID.oakPupil],
    ["an id that is not a number", "abc"],
  ])("is refused for %s", async (_who, studentId) => {
    signInAs(ID.parent);
    expect((await set(studentId)).status).toBe(404);
    if (typeof studentId === "number") expect(account(studentId).profilePassword).toBeNull();
  });

  it.each([
    ["a teacher", ID.oakTeacher],
    ["the pupil", ID.linkedPupil],
    ["a School Admin", ID.oakAdmin],
  ])("is refused for %s", async (_who, id) => {
    signInAs(id);
    expect((await set(ID.linkedPupil)).status).toBe(403);
    expect(account(ID.linkedPupil).profilePassword).toBeNull();
  });

  it("needs a session", async () => {
    expect((await set(ID.linkedPupil)).status).toBe(401);
  });

  it.each([
    ["too short", "abc", "abc"],
    ["not matching", "home-password", "something-else"],
  ])("refuses a password that is %s", async (_why, password, confirm) => {
    signInAs(ID.parent);
    expect((await set(ID.linkedPupil, password, confirm)).status).toBe(400);
    expect(account(ID.linkedPupil).profilePassword).toBeNull();
  });
});

describe("logging in with no password set", () => {
  it("fails for a pupil whatever is typed", async () => {
    expect((await logIn("oak.pupil", "anything")).status).toBe(401);
  });

  it("fails for a pupil of a switched-off school, even with the right password", async () => {
    account(ID.closedPupil).profilePassword = await hashPassword("home-password");
    expect((await logIn("closed.pupil", "home-password")).status).toBe(403);
  });
});
