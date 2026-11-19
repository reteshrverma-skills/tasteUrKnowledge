import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { passcodeProblem } from "@/lib/parent";
import { clientIp, hit, tooManyRequests } from "@/lib/rate-limit";
import {
  currentPasswordMatches,
  keepThisSessionOnly,
  seniorStudentOrError,
} from "@/lib/student-account";

/**
 * A GCSE / A-Level student setting or changing their own 6-digit login Pin.
 * The current password is required. Other devices are signed out.
 */
export async function POST(request: NextRequest) {
  const session = await seniorStudentOrError();
  if (session instanceof NextResponse) return session;

  const wait = hit(`student-passcode:${session.userId}:${clientIp(request)}`, 10, 15);
  if (wait > 0) return tooManyRequests(wait);

  try {
    const body = await request.json().catch(() => ({}));
    if (!(await currentPasswordMatches(session.userId, body.currentPassword))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    const problem = passcodeProblem(body.passcode, body.confirmPasscode);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    await prisma.userProfile.update({
      where: { id: session.userId },
      data: { profilePasscode: await hashPassword(body.passcode) },
    });
    await keepThisSessionOnly(session);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Student set passcode error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
