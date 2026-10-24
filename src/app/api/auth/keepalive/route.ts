import { NextResponse } from "next/server";
import { SESSION_MAX_AGE_SECONDS, getSession, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Renews the session while the user is active.
 *
 * Sessions end after the idle time in src/config/session.json. The browser
 * calls this when it sees activity (at most every few minutes), and each call
 * issues a fresh token and cookie, so the hour counts from the last activity,
 * not from login. A user who goes quiet stops calling it and the token
 * expires by itself - even if the page is left open.
 *
 * A token that has already expired gets 401, so the browser knows to send the
 * user to the login page rather than keep trying.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Re-read the account on renewal: a parent moving a child to another
  // programme, or an admin deactivating an account, takes effect within a few
  // minutes instead of at the next login.
  const account = await prisma.userProfile.findUnique({
    where: { id: session.userId },
    select: { isActive: true, programmeCode: true },
  });
  if (!account?.isActive) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only the session fields are carried over; the old token's iat/exp must
  // not be copied into the new one.
  const token = signToken({
    userId: session.userId,
    profileName: session.profileName,
    userType: session.userType,
    programme: account.programmeCode,
  });

  const response = NextResponse.json({ renewed: true });
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
