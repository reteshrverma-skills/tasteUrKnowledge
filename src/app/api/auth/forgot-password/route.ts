import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { sendPasswordResetEmail } from "@/lib/email";
import { RESET_VALID_MINUTES, issueResetToken } from "@/lib/password-reset";

/**
 * Always the same answer, whatever happened.
 *
 * Saying "no account with that email" turns this endpoint into a way to test
 * whether an address is registered - on a service used by children, that is a
 * list worth not handing out. So an unknown address, a known one, and an
 * account with no email on file all look identical from outside.
 */
const SAME_ANSWER = {
  message:
    "If that account exists and has an email address on file, a reset link is on its way.",
};

/** Accepts either the login id or the registered email, since people forget which. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier =
      typeof body.identifier === "string" ? body.identifier.trim() : "";

    if (!identifier) {
      return NextResponse.json(
        { error: "Enter your user ID or email address" },
        { status: 400 }
      );
    }

    const user = await prisma.userProfile.findFirst({
      where: {
        OR: [
          { profileName: { equals: identifier, mode: "insensitive" } },
          {
            personalDetails: {
              emailAddress: { equals: identifier, mode: "insensitive" },
            },
          },
        ],
      },
      select: {
        id: true,
        fName: true,
        mName: true,
        lName: true,
        profileName: true,
        isActive: true,
        personalDetails: { select: { emailAddress: true } },
      },
    });

    const email = user?.personalDetails?.emailAddress?.trim();

    // A deactivated account is not a route back in, and an account with no
    // email has nowhere to send the link. Both fall through to the same reply.
    if (user && user.isActive && email) {
      const token = await issueResetToken(user.id);

      // Built from the request, so the link points at whichever host the
      // person is actually using rather than a hardcoded domain.
      const base = process.env.APP_URL ?? request.nextUrl.origin;
      const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;

      await sendPasswordResetEmail(
        email,
        displayName(user),
        resetUrl,
        RESET_VALID_MINUTES
      );
    }

    return NextResponse.json(SAME_ANSWER, { status: 200 });
  } catch (error) {
    // Even a failure here keeps its mouth shut about which account was named.
    console.error("Forgot password error:", error);
    return NextResponse.json(SAME_ANSWER, { status: 200 });
  }
}
