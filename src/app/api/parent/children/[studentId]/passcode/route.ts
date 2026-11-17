import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endAllSessions, getSessionOrThrow, hashPassword } from "@/lib/auth";
import { ownsChild, passcodeProblem } from "@/lib/parent";

/**
 * A parent setting or resetting the 6-digit passcode their child can log in
 * with instead of a password. Works for a home child and a linked school pupil
 * alike (ownsChild). Like a password change, it ends any open session.
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
    const problem = passcodeProblem(body.passcode, body.confirmPasscode);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    await prisma.userProfile.update({
      where: { id: studentId },
      data: { profilePasscode: await hashPassword(body.passcode) },
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
    console.error("Set child passcode error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
