import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { LOGO_MAX_BYTES, logoTypeOf, pupilSchoolFor } from "@/lib/school-logo";
import { DELETE as removeLogo, GET as getLogo, POST as uploadLogo } from "@/app/api/school/logo/route";
import { db } from "../support/fake-prisma";
import { ID, signInAs, signOut } from "../support/world";

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3];
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 1, 2, 3];
const WEBP = [...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP"), 1, 2];
const SVG = [...Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')];

const school = (id: number) => db.school.find((s) => s.id === BigInt(id))!;
const OAK = 1;
const BIRCH = 2;

function upload(bytes: number[] | Buffer, statedType = "image/png") {
  const form = new FormData();
  form.append("logo", new File([new Uint8Array(bytes)], "logo.png", { type: statedType }));
  return uploadLogo(new NextRequest("http://test.local/api/school/logo", { method: "POST", body: form }));
}

const headerFor = async (id: number) => {
  signInAs(id);
  return pupilSchoolFor(await getSession());
};

describe("logoTypeOf", () => {
  it("recognises PNG, JPG and WebP from the file itself", () => {
    expect(logoTypeOf(new Uint8Array(PNG))).toBe("image/png");
    expect(logoTypeOf(new Uint8Array(JPEG))).toBe("image/jpeg");
    expect(logoTypeOf(new Uint8Array(WEBP))).toBe("image/webp");
  });

  it("refuses anything else", () => {
    expect(logoTypeOf(new Uint8Array(SVG))).toBeNull();
    expect(logoTypeOf(new Uint8Array(0))).toBeNull();
  });
});

describe("uploading a logo", () => {
  it("saves it on the School Admin's own school", async () => {
    signInAs(ID.oakAdmin);
    expect((await upload(PNG)).status).toBe(200);

    expect(school(OAK).logoType).toBe("image/png");
    expect(school(OAK).logoUpdatedAt).toBeInstanceOf(Date);
    expect(school(BIRCH).logoData).toBeUndefined();
  });

  it.each([
    ["a teacher", ID.oakTeacher],
    ["a pupil", ID.oakPupil],
    ["a parent", ID.parent],
    ["a site admin", ID.admin],
  ])("is refused for %s", async (_who, id) => {
    signInAs(id);
    expect((await upload(PNG)).status).toBe(403);
    expect(school(OAK).logoData).toBeUndefined();
  });

  it("needs a session", async () => {
    expect((await upload(PNG)).status).toBe(401);
  });

  it("refuses a script dressed up as a PNG", async () => {
    signInAs(ID.oakAdmin);
    expect((await upload(SVG, "image/png")).status).toBe(400);
    expect(school(OAK).logoData).toBeUndefined();
  });

  it("refuses a file over the limit", async () => {
    signInAs(ID.oakAdmin);
    const tooLarge = Buffer.concat([Buffer.from(PNG), Buffer.alloc(LOGO_MAX_BYTES)]);
    expect((await upload(tooLarge)).status).toBe(413);
    expect(school(OAK).logoData).toBeUndefined();
  });

  it("refuses a request with no file", async () => {
    signInAs(ID.oakAdmin);
    const response = await uploadLogo(
      new NextRequest("http://test.local/api/school/logo", { method: "POST", body: new FormData() })
    );
    expect(response.status).toBe(400);
  });
});

describe("seeing a logo", () => {
  const withLogos = async () => {
    signInAs(ID.oakAdmin);
    await upload(PNG);
    signInAs(ID.birchAdmin);
    await upload(JPEG);
  };

  it.each([
    ["its School Admin", ID.oakAdmin],
    ["its teacher", ID.oakTeacher],
    ["its pupil", ID.oakPupil],
  ])("serves a school's logo to %s", async (_who, id) => {
    await withLogos();
    signInAs(id);
    const response = await getLogo();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual(PNG);
  });

  it("serves each account only its own school's logo", async () => {
    await withLogos();
    signInAs(ID.birchPupil);
    const response = await getLogo();
    expect(response.headers.get("content-type")).toBe("image/jpeg");
  });

  it("has nothing for an account with no school, or a school with no logo", async () => {
    signInAs(ID.oakPupil);
    expect((await getLogo()).status).toBe(404);

    await withLogos();
    signInAs(ID.parent);
    expect((await getLogo()).status).toBe(404);
    signInAs(ID.homeChild);
    expect((await getLogo()).status).toBe(404);
  });

  it("needs a session", async () => {
    await withLogos();
    signOut();
    expect((await getLogo()).status).toBe(401);
  });

  it("heads a pupil's page with their own school, logo and name", async () => {
    await withLogos();
    const header = await headerFor(ID.oakPupil);
    expect(header?.schoolName).toBe("Oakwood");
    expect(header?.logoUrl).toContain("/api/school/logo");
    expect(header?.person).toBeTruthy();
    expect((await headerFor(ID.birchPupil))?.schoolName).toBe("Birchwood");
  });

  it("still names the school when it has no logo", async () => {
    expect(await headerFor(ID.oakPupil)).toMatchObject({ schoolName: "Oakwood", logoUrl: null });
  });

  it.each([
    ["a child at home", ID.homeChild],
    ["a parent", ID.parent],
    ["a teacher, who has their own header", ID.oakTeacher],
  ])("adds no pupil header for %s", async (_who, id) => {
    await withLogos();
    expect(await headerFor(id)).toBeNull();
  });

  it("adds no pupil header without a session", async () => {
    expect(await pupilSchoolFor(null)).toBeNull();
  });

  it("changes the address with each upload, so a new logo shows at once", async () => {
    signInAs(ID.oakAdmin);
    await upload(PNG);
    const first = (await headerFor(ID.oakPupil))!.logoUrl;

    school(OAK).logoUpdatedAt = new Date(school(OAK).logoUpdatedAt.getTime() + 1000);
    expect((await headerFor(ID.oakPupil))!.logoUrl).not.toBe(first);
  });
});

describe("removing a logo", () => {
  it("clears it and keeps the school", async () => {
    signInAs(ID.oakAdmin);
    await upload(PNG);
    const schools = db.school.length;

    expect((await removeLogo()).status).toBe(200);
    expect(school(OAK)).toMatchObject({ logoData: null, logoType: null, logoUpdatedAt: null });
    expect(db.school).toHaveLength(schools);
    expect((await getLogo()).status).toBe(404);
    expect((await headerFor(ID.oakPupil))?.logoUrl).toBeNull();
  });

  it("is for the School Admin only", async () => {
    signInAs(ID.oakAdmin);
    await upload(PNG);

    signInAs(ID.oakTeacher);
    expect((await removeLogo()).status).toBe(403);
    expect(school(OAK).logoType).toBe("image/png");
  });

  it("leaves other schools' logos alone", async () => {
    signInAs(ID.birchAdmin);
    await upload(JPEG);
    signInAs(ID.oakAdmin);
    await removeLogo();
    expect(school(BIRCH).logoType).toBe("image/jpeg");
  });
});
