import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SESSION_MAX_AGE_SECONDS,
  getSession,
  signToken,
  verifyPassword,
} from "@/lib/auth";
import { recordLogout } from "@/lib/login-session";
import { endClassroomTurn } from "@/lib/school";
import { blockedFor, record, tooManyRequests } from "@/lib/rate-limit";

/** Wrong tries allowed per turn before it locks; a 4-digit PIN is guessable. */
const MAX_TRIES = 5;
const LOCK_MINUTES = 15;

/**
 * Ends a pupil's classroom turn and hands the device back to the teacher who
 * opened it, once the teacher's PIN (or password) is entered.
 *
 * Tries are counted per turn, so a child cannot work through the PIN. When
 * the turn locks, the teacher ends it from their screen on another device.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.teacherId || !session.classroomId) {
      return NextResponse.json({ error: "This is not a classroom session" }, { status: 400 });
    }

    const key = `classroom-exit:${session.classroomId}`;
    const wait = blockedFor(key, MAX_TRIES);
    if (wait > 0) {
      return tooManyRequests(
        wait,
        "Too many wrong tries. End this pupil's turn from your teacher screen on another device."
      );
    }

    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";

    const teacher = await prisma.userProfile.findFirst({
      where: { id: session.teacherId, userType: "TEACHER", isActive: true },
      select: { id: true, profileName: true, programmeCode: true, profilePassword: true, pinHash: true },
    });
    if (!teacher) {
      return NextResponse.json({ error: "The teacher's account is not active" }, { status: 403 });
    }

    const pinMatches =
      /^\d{4}$/.test(code) && teacher.pinHash !== null && (await verifyPassword(code, teacher.pinHash));
    const passwordMatches =
      !pinMatches && code.length > 0 && (await verifyPassword(code, teacher.profilePassword));
    if (!pinMatches && !passwordMatches) {
      record(key, LOCK_MINUTES);
      return NextResponse.json({ error: "That is not right" }, { status: 401 });
    }

    await recordLogout(session.userId);
    await endClassroomTurn(session.classroomId, session.userId, "exit");

    // Teachers hold any number of sessions, so the token needs no session key.
    const token = signToken({
      userId: Number(teacher.id),
      profileName: teacher.profileName,
      userType: "TEACHER",
      programme: teacher.programmeCode,
    });
    const response = NextResponse.json({ redirect: "/teacher" }, { status: 200 });
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
  } catch (error) {
    console.error("Classroom exit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
