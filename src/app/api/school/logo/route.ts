import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { guardStatus, requireSchoolStaff } from "@/lib/school";
import { LOGO_MAX_BYTES, logoTypeOf } from "@/lib/school-logo";

const TOO_LARGE = "The logo must be 1 MB or smaller";
/** Room for the form's own wrapping around the file. */
const MAX_REQUEST_BYTES = LOGO_MAX_BYTES + 64 * 1024;

/**
 * The logo of the signed-in account's own school. The school comes from the
 * account, never from the request, so no id can be changed to reach another
 * school's.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await prisma.userProfile.findUnique({
    where: { id: session.userId },
    select: { school: { select: { logoData: true, logoType: true } } },
  });
  const logo = row?.school;
  if (!logo?.logoData || !logo.logoType) {
    return NextResponse.json({ error: "No logo" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(logo.logoData), {
    headers: {
      "Content-Type": logo.logoType,
      // The page's URL for the logo changes with each upload (logoUrlFor).
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

/** School Admin: add or replace the school's logo. */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireSchoolStaff(["SCHOOL_ADMIN"]);

    if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: TOO_LARGE }, { status: 413 });
    }
    const form = await request.formData().catch(() => null);
    const file = form?.get("logo");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Please choose an image" }, { status: 400 });
    }
    if (file.size > LOGO_MAX_BYTES) {
      return NextResponse.json({ error: TOO_LARGE }, { status: 413 });
    }

    const logoData = Buffer.from(await file.arrayBuffer());
    const logoType = logoTypeOf(logoData);
    if (!logoType) {
      return NextResponse.json({ error: "The logo must be a PNG, JPG or WebP image" }, { status: 400 });
    }

    await prisma.school.update({
      where: { id: staff.schoolId },
      data: { logoData, logoType, logoUpdatedAt: new Date() },
      select: { id: true },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Save school logo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** School Admin: take the logo off. Clears the columns; the school row stays. */
export async function DELETE() {
  try {
    const staff = await requireSchoolStaff(["SCHOOL_ADMIN"]);
    await prisma.school.update({
      where: { id: staff.schoolId },
      data: { logoData: null, logoType: null, logoUpdatedAt: null },
      select: { id: true },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Remove school logo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
