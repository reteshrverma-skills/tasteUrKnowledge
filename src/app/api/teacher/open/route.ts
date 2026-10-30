import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_MAX_AGE_SECONDS, signToken, startSingleSession } from "@/lib/auth";
import { closeOpenSessions, recordLogin } from "@/lib/login-session";
import { guardStatus, idFrom, pupilFor, requireSchoolStaff } from "@/lib/school";

/**
 * Teacher: hand this device to a pupil.
 *
 * The device's teacher token is replaced by one for the pupil - no password,
 * the teacher vouches for them - so the child cannot get back to the class
 * list. The pupil's token carries the teacher and the classroomSession row;
 * logging out of it asks for the teacher's PIN (/classroom/exit).
 *
 * A pupil is on one device at a time: opening them here ends a turn open
 * anywhere else, through the same single-session key every student has.
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireSchoolStaff(["TEACHER"]);
    const body = await request.json().catch(() => ({}));

    const studentId = idFrom(body.studentId);
    if (!(await pupilFor(staff, studentId)) || studentId === null) {
      return NextResponse.json({ error: "That pupil is not in your classes" }, { status: 403 });
    }
    const pupil = await prisma.userProfile.findUnique({
      where: { id: studentId },
      select: { id: true, profileName: true, programmeCode: true },
    });
    if (!pupil) {
      return NextResponse.json({ error: "That pupil is not in your classes" }, { status: 403 });
    }
    const pupilId = Number(pupil.id);

    await prisma.classroomSession.updateMany({
      where: { studentId: pupil.id, endedAt: null },
      data: { endedAt: new Date(), endReason: "replaced" },
    });
    await closeOpenSessions(pupilId, "replaced");
    const sid = await startSingleSession(pupilId);

    const turn = await prisma.classroomSession.create({
      data: {
        studentId: pupil.id,
        teacherId: BigInt(staff.userId),
        userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
      select: { id: true },
    });
    // The pupil counts in the login statistics like any other student.
    await recordLogin(pupilId);

    const token = signToken({
      userId: pupilId,
      profileName: pupil.profileName,
      userType: "STUDENT",
      programme: pupil.programmeCode,
      sid,
      teacherId: staff.userId,
      classroomId: Number(turn.id),
    });

    // A relative path for the client to follow, as login does (see there).
    const response = NextResponse.json({ redirect: "/dashboard" }, { status: 200 });
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Open pupil error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
