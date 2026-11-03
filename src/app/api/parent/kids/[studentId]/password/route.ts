import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endAllSessions, getSessionOrThrow, hashPassword } from "@/lib/auth";
import { ownsChild, passwordProblem } from "@/lib/parent";

/**
 * A parent setting the password their linked school pupil uses to log in at
 * home. This is the one thing a parent may change on a school pupil - name,
 * Year and the rest stay with the school (ownsManagedChild).
 *
 * The parent is signed in and linked by the school, so no current password is
 * asked for: a new pupil has none. Any session the pupil has open ends, as with
 * every password change, and so does a classroom turn with it.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "PARENT") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { studentId: raw } = await params;
    const studentId = Number(raw);
    if (!(await ownsChild(session.userId, studentId))) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const problem = passwordProblem(body.password, body.confirmPassword);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    await prisma.userProfile.update({
      where: { id: studentId },
      data: { profilePassword: await hashPassword(body.password) },
    });
    await prisma.classroomSession.updateMany({
      where: { studentId, endedAt: null },
      data: { endedAt: new Date(), endReason: "password_changed" },
    });
    await endAllSessions(studentId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Set pupil password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
