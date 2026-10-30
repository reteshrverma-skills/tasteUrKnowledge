import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createPupil,
  endClassroomTurn,
  generatedLoginIdFor,
  guardStatus,
  idFrom,
  pupilFor,
  pupilUsernameFrom,
  requireFreeSeat,
  requireSchoolStaff,
  text,
  yearFor,
} from "@/lib/school";

/**
 * School Admin or teacher: add a pupil to a Year - name, Year and an optional
 * username. The pupil has no password and is opened by their teacher. A
 * teacher can add pupils only to Years they take.
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireSchoolStaff();
    const body = await request.json().catch(() => ({}));

    const fName = text(body.fName);
    const lName = text(body.lName);
    if (!fName || !lName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }
    const year = await yearFor(staff, text(body.yearId));
    if (!year) {
      return NextResponse.json({ error: "Please choose a year" }, { status: 400 });
    }

    const username = await pupilUsernameFrom(body.username);
    if (username && typeof username === "object") {
      return NextResponse.json({ error: username.error }, { status: 400 });
    }

    const studentId = await createPupil(staff, year, { fName, lName }, username);
    return NextResponse.json({ studentId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Seats") {
      return NextResponse.json(
        { error: "The school has used all its pupil seats. Please contact SIGQS support for more." },
        { status: 400 }
      );
    }
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Create pupil error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * School Admin or teacher: edit a pupil - name, username, Year and whether
 * they are active. A teacher can edit only pupils in Years they take, but
 * may move them to any Year. Clearing the username gives the
 * pupil a made-up one; the password stays null throughout.
 *
 * Switching a pupil off ends any turn they have open; switching one back on
 * needs a free seat.
 */
export async function PATCH(request: NextRequest) {
  try {
    const staff = await requireSchoolStaff();
    const body = await request.json().catch(() => ({}));

    const studentId = idFrom(body.studentId);
    const pupil = await pupilFor(staff, studentId, { includeInactive: true });
    if (!pupil || studentId === null) {
      return NextResponse.json({ error: "That pupil is not in your years" }, { status: 404 });
    }

    const fName = text(body.fName);
    const lName = text(body.lName);
    if (!fName || !lName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }
    // Any Year: a teacher moving a pupil up (or to the right class) may send
    // them to a Year they do not take, after which the pupil leaves their list.
    const yearId = text(body.yearId);
    const year = yearId
      ? await prisma.year.findUnique({ where: { id: yearId }, select: { id: true } })
      : null;
    if (!year) {
      return NextResponse.json({ error: "Please choose a year" }, { status: 400 });
    }
    const username = await pupilUsernameFrom(body.username, studentId);
    if (username && typeof username === "object") {
      return NextResponse.json({ error: username.error }, { status: 400 });
    }
    const isActive = body.isActive !== false;
    if (isActive && !pupil.student.isActive) await requireFreeSeat(staff.schoolId);

    await prisma.userProfile.update({
      where: { id: studentId },
      data: {
        fName,
        lName,
        profileName: username ?? generatedLoginIdFor(staff.schoolId, pupil.student.profileName),
        isActive,
        studentDetails: { update: { studentYear: year.id } },
      },
    });

    if (!isActive) {
      const open = await prisma.classroomSession.findMany({
        where: { studentId, endedAt: null },
        select: { id: true },
      });
      for (const turn of open) {
        await endClassroomTurn(Number(turn.id), Number(studentId), "ended_by_teacher");
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Seats") {
      return NextResponse.json(
        { error: "The school has used all its pupil seats. Please contact SIGQS support for more." },
        { status: 400 }
      );
    }
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Edit pupil error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
