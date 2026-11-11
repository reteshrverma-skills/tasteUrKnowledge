import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountBlocked, signedInResponse } from "@/lib/login-complete";
import { verifiedGoogleEmail } from "@/lib/google-id-token";
import { blockedFor, clientIp, record, tooManyRequests } from "@/lib/rate-limit";
import security from "@/config/security.json";

const LIMITS = security.login;

/**
 * "Continue with Google": signs in the existing SIGQS account whose login
 * email (userProfile.email, migration 044) matches the Google account's
 * verified email.
 *
 * It never creates an account - sign-up still goes through the register form
 * and its Terms agreement - and never signs in a student, who has no login
 * email and uses their user ID.
 */
export async function POST(request: NextRequest) {
  try {
    const ipKey = `login:ip:${clientIp(request)}`;
    const wait = blockedFor(ipKey, LIMITS.maxAttemptsPerIp);
    if (wait > 0) return tooManyRequests(wait);
    record(ipKey, LIMITS.windowMinutes);

    const body = await request.json().catch(() => ({}));
    const email = await verifiedGoogleEmail(body.credential);
    if (!email) {
      return NextResponse.json(
        { error: "Google sign-in did not work. Please try again." },
        { status: 401 }
      );
    }

    const user = await prisma.userProfile.findUnique({ where: { email } });
    if (!user || user.userType === "STUDENT") {
      return NextResponse.json(
        {
          error:
            "No SIGQS account uses this Google email. Sign in with your user ID, or add this email to your profile first.",
        },
        { status: 404 }
      );
    }

    const blocked = await accountBlocked(user);
    if (blocked) return blocked;

    return await signedInResponse(user);
  } catch (error) {
    console.error("Google login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
