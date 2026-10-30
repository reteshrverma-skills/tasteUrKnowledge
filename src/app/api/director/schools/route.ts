import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { DEFAULT_PROGRAMME, validProgrammeCode } from "@/lib/programme";
import {
  endClassroomTurn,
  guardStatus,
  idFrom,
  staffAccountData,
  staffInputFrom,
  text,
} from "@/lib/school";

/**
 * Product Director (or admin): create a school together with its first
 * School Admin, in one step so a school never exists without someone able to
 * run it. The proxy does not cover /api, so the role check here is the guard.
 */
async function requireDirector() {
  const session = await getSessionOrThrow();
  if (session.userType !== "PRODUCT_DIRECTOR" && session.userType !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

/**
 * The school's own details from a form post, shared by create and edit, or
 * the message to show. A blank contact email is left null here; create falls
 * back to the School Admin's.
 */
function schoolFieldsFrom(body: Record<string, unknown>) {
  const name = text(body.schoolName, 200);
  if (!name) return "School name is required";

  let maxStudents: number | null = null;
  if (body.maxStudents !== undefined && body.maxStudents !== "" && body.maxStudents !== null) {
    maxStudents = Number(body.maxStudents);
    if (!Number.isInteger(maxStudents) || maxStudents < 1 || maxStudents > 100_000) {
      return "Pupil seats must be a whole number, or left blank for no limit";
    }
  }

  const contactEmail = text(body.contactEmail, 254)?.toLowerCase() ?? null;
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return "Please enter a valid contact email";
  }

  return {
    name,
    address1: text(body.address1, 200),
    address2: text(body.address2, 200),
    city: text(body.city),
    postcode: text(body.postcode, 20),
    contactEmail,
    maxStudents,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireDirector();
    const body = await request.json().catch(() => ({}));

    const fields = schoolFieldsFrom(body);
    if (typeof fields === "string") {
      return NextResponse.json({ error: fields }, { status: 400 });
    }

    const programmeCode = await validProgrammeCode(body.programmeCode ?? DEFAULT_PROGRAMME);
    if (!programmeCode) {
      return NextResponse.json({ error: "Please choose a programme" }, { status: 400 });
    }

    // The School Admin's login, under its own field names in the form.
    const admin = await staffInputFrom({
      fName: body.adminFName,
      lName: body.adminLName,
      email: body.adminEmail,
      profileName: body.adminProfileName,
      password: body.adminPassword,
      confirmPassword: body.adminConfirmPassword,
    });
    if (typeof admin === "string") {
      return NextResponse.json({ error: admin }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          ...fields,
          contactEmail: fields.contactEmail ?? admin.email,
          programmeCode,
          createdById: BigInt(session.userId),
        },
        select: { id: true, name: true },
      });
      const account = await tx.userProfile.create({
        data: await staffAccountData(admin, "SCHOOL_ADMIN", school.id, programmeCode),
        select: { profileName: true },
      });
      return { school: school.name, profileName: account.profileName };
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Create school error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Product Director (or admin): edit a school's details - name, address,
 * contact email, pupil seats and whether it is active. Programme is not
 * editable here: changing it would move every pupil's content.
 *
 * Switching a school off signs out its staff and pupils (the session check
 * reads the school's isActive) and closes any classroom turns left open.
 * Lowering the seats below the pupils already there only stops new ones.
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireDirector();
    const body = await request.json().catch(() => ({}));

    const schoolId = idFrom(body.schoolId);
    const school = schoolId
      ? await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } })
      : null;
    if (!school) {
      return NextResponse.json({ error: "That school does not exist" }, { status: 404 });
    }

    const fields = schoolFieldsFrom(body);
    if (typeof fields === "string") {
      return NextResponse.json({ error: fields }, { status: 400 });
    }
    const isActive = body.isActive !== false;

    await prisma.school.update({
      where: { id: school.id },
      data: { ...fields, isActive },
    });

    if (!isActive) {
      const open = await prisma.classroomSession.findMany({
        where: { endedAt: null, student: { schoolId: school.id } },
        select: { id: true, studentId: true },
      });
      for (const turn of open) {
        await endClassroomTurn(Number(turn.id), Number(turn.studentId), "school_inactive");
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Edit school error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
