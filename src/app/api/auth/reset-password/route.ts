import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { passwordProblem } from "@/lib/parent";
import { resolveResetToken, spendTokenOp } from "@/lib/password-reset";

const BAD_TOKEN = {
  error:
    "This reset link is no longer valid. Ask for a new one from the login page.",
};

/**
 * Checks a link before showing the new-password form, so somebody following a
 * stale link is told immediately rather than after typing a password twice.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const resolved = await resolveResetToken(token);

  if (!resolved) {
    return NextResponse.json(BAD_TOKEN, { status: 400 });
  }

  return NextResponse.json({ valid: true }, { status: 200 });
}

/**
 * Sets the new password.
 *
 * The token is re-checked here rather than trusted from the GET above: the two
 * requests are minutes apart, and nothing stops someone calling this one
 * directly. Spending the token and changing the password happen in a single
 * transaction, so a link can never be used twice even on a double submit.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body as {
      token?: string;
      password?: string;
      confirmPassword?: string;
    };

    const resolved = await resolveResetToken(token);
    if (!resolved) {
      return NextResponse.json(BAD_TOKEN, { status: 400 });
    }

    const problem = passwordProblem(password, confirmPassword);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const profilePassword = await hashPassword(password as string);

    await prisma.$transaction([
      prisma.userProfile.update({
        where: { id: resolved.userId },
        data: { profilePassword },
      }),
      spendTokenOp(resolved.id),
      // Any other link that was still outstanding dies with this change; a
      // password reset should close every open door, not just the one used.
      prisma.passwordResetToken.updateMany({
        where: { userId: resolved.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
