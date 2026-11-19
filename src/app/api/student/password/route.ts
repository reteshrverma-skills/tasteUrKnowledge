import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { passwordProblem } from "@/lib/parent";
import { clientIp, hit, tooManyRequests } from "@/lib/rate-limit";
import {
  currentPasswordMatches,
  keepThisSessionOnly,
  seniorStudentOrError,
} from "@/lib/student-account";

/**
 * A GCSE / A-Level student changing their own password. The current password
 * is required. Other devices are signed out; this one stays signed in.
 */
export async function POST(request: NextRequest) {
  const session = await seniorStudentOrError();
  if (session instanceof NextResponse) return session;

  // Slows guessing of the current password from a stolen session.
  const wait = hit(`student-password:${session.userId}:${clientIp(request)}`, 10, 15);
  if (wait > 0) return tooManyRequests(wait);

  try {
    const body = await request.json().catch(() => ({}));
    if (!(await currentPasswordMatches(session.userId, body.currentPassword))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    const problem = passwordProblem(body.password, body.confirmPassword);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    await prisma.userProfile.update({
      where: { id: session.userId },
      data: { profilePassword: await hashPassword(body.password) },
    });
    await keepThisSessionOnly(session);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Student change password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
