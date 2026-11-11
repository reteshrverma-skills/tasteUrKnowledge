import { NextResponse } from "next/server";
import type { UserProfile } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SESSION_MAX_AGE_SECONDS,
  homePathFor,
  signToken,
  startSingleSession,
} from "@/lib/auth";
import { closeOpenSessions, recordLogin } from "@/lib/login-session";

/**
 * The parts of signing in that do not depend on how the person proved who
 * they are - shared by the password login and Google sign-in.
 */

/** Why this account may not sign in at all, or null when it may. */
export async function accountBlocked(user: UserProfile): Promise<NextResponse | null> {
  if (!user.isActive) {
    return NextResponse.json(
      { error: "This account is inactive. Please contact an administrator." },
      { status: 403 }
    );
  }

  // A school's staff cannot sign in once the school is switched off.
  if (user.schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { isActive: true },
    });
    if (!school?.isActive) {
      return NextResponse.json(
        { error: "This school's account is inactive. Please contact SIGQS support." },
        { status: 403 }
      );
    }
  }

  return null;
}

/** Starts the session and returns the response that sets its cookie. */
export async function signedInResponse(user: UserProfile): Promise<NextResponse> {
  // One session per account: this login ends any other (another device,
  // another browser), whose next request is sent to the login page.
  // Teachers are the exception - they sign in on several classroom devices
  // at once - so their token carries no session key.
  let sid: string | undefined;
  if (!user.allowMultipleSessions) {
    await closeOpenSessions(Number(user.id), "replaced");
    // A pupil logging in at home ends any turn they have open in class.
    await prisma.classroomSession.updateMany({
      where: { studentId: user.id, endedAt: null },
      data: { endedAt: new Date(), endReason: "replaced" },
    });
    sid = await startSingleSession(Number(user.id));
  }

  const token = signToken({
    userId: Number(user.id),
    profileName: user.profileName,
    userType: user.userType,
    programme: user.programmeCode,
    sid,
  });

  // Opens the audit row. Non-fatal: a tracking failure must not block login.
  await recordLogin(Number(user.id));

  // The destination goes back as data and the client navigates, rather than
  // an HTTP redirect: behind Azure's reverse proxy a server-built absolute URL
  // named the internal host (http://localhost:8080), which the browser cannot
  // reach. A relative path sidesteps that, and matches how register works.
  const response = NextResponse.json(
    { success: true, redirect: homePathFor(user.userType) },
    { status: 200 }
  );

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
}
