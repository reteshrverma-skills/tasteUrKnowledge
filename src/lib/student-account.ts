import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  setAuthCookie,
  signToken,
  startSingleSession,
  verifyPassword,
  type Session,
} from "@/lib/auth";
import { DEFAULT_PROGRAMME } from "@/lib/programme";

/**
 * Helpers for a GCSE / A-Level student managing their own account from
 * My Profile. Grammar School children are managed by their parent instead.
 */

export function isSeniorStudent(session: Session | null): session is Session {
  return session?.userType === "STUDENT" && session.programme !== DEFAULT_PROGRAMME;
}

/** The session, or a ready error response. */
export async function seniorStudentOrError(): Promise<Session | NextResponse> {
  try {
    const session = await getSessionOrThrow();
    if (!isSeniorStudent(session)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    return session;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** Whether the typed password is the student's current one. */
export async function currentPasswordMatches(userId: number, password: unknown): Promise<boolean> {
  if (typeof password !== "string" || !password) return false;
  const row = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { profilePassword: true },
  });
  return verifyPassword(password, row?.profilePassword ?? null);
}

/**
 * After a password or Pin change: a fresh session key ends the session on any
 * other device, and this device gets a new token so it stays signed in.
 */
export async function keepThisSessionOnly(session: Session): Promise<void> {
  const sid = await startSingleSession(session.userId);
  await setAuthCookie(
    signToken({
      userId: session.userId,
      profileName: session.profileName,
      userType: session.userType,
      programme: session.programme,
      sid,
    })
  );
}
