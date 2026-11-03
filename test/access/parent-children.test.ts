import { describe, expect, it } from "vitest";
import { listChildren, ownsChild, ownsManagedChild } from "@/lib/parent";
import { DELETE as deleteKid, PUT as updateKid } from "@/app/api/parent/kids/[studentId]/route";
import { ID, account, jsonRequest, paramsFor, signInAs } from "../support/world";
import { db } from "../support/fake-prisma";

describe("listChildren", () => {
  it("gives a parent their own children and nobody else's", async () => {
    const children = await listChildren(ID.parent);
    expect(children.map((c) => c.studentId).sort()).toEqual([ID.linkedPupil, ID.homeChild].sort());
  });

  it("says which child the school manages", async () => {
    const children = await listChildren(ID.parent);
    expect(children.find((c) => c.studentId === ID.linkedPupil)?.schoolName).toBe("Oakwood");
    expect(children.find((c) => c.studentId === ID.homeChild)?.schoolName).toBeNull();
  });

  it("gives a parent with no children an empty list", async () => {
    expect(await listChildren(ID.freeParent)).toEqual([]);
  });
});

describe("ownsChild", () => {
  it("is true for a home child and for a linked school pupil", async () => {
    expect(await ownsChild(ID.parent, ID.homeChild)).toBe(true);
    expect(await ownsChild(ID.parent, ID.linkedPupil)).toBe(true);
  });

  it("is false for another parent's child and for an unlinked pupil", async () => {
    expect(await ownsChild(ID.parent, ID.otherHomeChild)).toBe(false);
    expect(await ownsChild(ID.parent, ID.oakPupil)).toBe(false);
  });

  it("is false for an id that is not a number", async () => {
    expect(await ownsChild(ID.parent, Number("abc"))).toBe(false);
  });
});

describe("ownsManagedChild", () => {
  it("is true for a parent's home child", async () => {
    expect(await ownsManagedChild(ID.parent, ID.homeChild)).toBe(true);
  });

  it("is false for a school pupil, even one linked to this parent", async () => {
    expect(await ownsManagedChild(ID.parent, ID.linkedPupil)).toBe(false);
  });

  it("is false for another parent's child", async () => {
    expect(await ownsManagedChild(ID.otherParent, ID.homeChild)).toBe(false);
  });
});

describe("a parent editing a child", () => {
  const body = { fName: "Changed", lName: "Name", studentYear: "y6" };
  const put = (studentId: number) =>
    updateKid(jsonRequest(`/api/parent/kids/${studentId}`, body, "PUT"), paramsFor(studentId));

  it("works for their own home child", async () => {
    signInAs(ID.parent);
    expect((await put(ID.homeChild)).status).toBe(200);
    expect(account(ID.homeChild).fName).toBe("Changed");
  });

  it.each([
    ["another parent's child", ID.otherHomeChild],
    ["a linked school pupil", ID.linkedPupil],
    ["an unlinked school pupil", ID.oakPupil],
  ])("is refused for %s and changes nothing", async (_who, studentId) => {
    signInAs(ID.parent);
    const name = account(studentId).fName;
    expect((await put(studentId)).status).toBe(404);
    expect(account(studentId).fName).toBe(name);
  });

  it("is for parents only", async () => {
    signInAs(ID.oakTeacher);
    expect((await put(ID.linkedPupil)).status).toBe(403);
    signInAs(ID.homeChild);
    expect((await put(ID.homeChild)).status).toBe(403);
  });

  it("needs a session", async () => {
    expect((await put(ID.homeChild)).status).toBe(401);
  });
});

describe("a parent deleting a child", () => {
  // Every case is refused before deleteChild runs, so nothing is removed.
  it.each([
    ["another parent's child", ID.otherHomeChild, "other.child"],
    ["a linked school pupil", ID.linkedPupil, "oak.linked"],
  ])("is refused for %s", async (_who, studentId, confirm) => {
    signInAs(ID.parent);
    const before = db.userProfile.length;
    const response = await deleteKid(
      jsonRequest(`/api/parent/kids/${studentId}`, { mode: "account", confirm }, "DELETE"),
      paramsFor(studentId)
    );
    expect(response.status).toBe(404);
    expect(db.userProfile).toHaveLength(before);
  });
});
