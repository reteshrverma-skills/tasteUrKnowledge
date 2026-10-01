import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, hashPassword } from "@/lib/auth";
import { normaliseProfileName, passwordProblem } from "@/lib/parent";
import { defaultEntitlementsForYear } from "@/lib/student";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * A parent creating a child.
 *
 * The child gets a STUDENT profile of their own - they log in and practise as
 * themselves - and a userStudentDetails row carrying parentId, which is what
 * makes them appear on this parent's Kids Profile and nobody else's.
 *
 * Starter is unlocked on creation. Without at least one level a new child sees
 * an empty dashboard in every subject, which reads as the app being broken;
 * the levels above it stay locked.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "PARENT") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const body = await request.json();
    const fName = text(body.fName);
    const lName = text(body.lName);

    if (!fName || !lName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const loginId = normaliseProfileName(body.profileName);
    if (!loginId) {
      return NextResponse.json(
        {
          error:
            "Login id must be 3-30 characters, using letters, numbers, dot, dash or underscore",
        },
        { status: 400 }
      );
    }

    const problem = passwordProblem(body.password, body.confirmPassword);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const studentYear = text(body.studentYear);
    if (!studentYear) {
      return NextResponse.json(
        { error: "Please choose a school year" },
        { status: 400 }
      );
    }

    const year = await prisma.year.findUnique({
      where: { id: studentYear },
      select: { id: true, name: true },
    });
    if (!year) {
      return NextResponse.json(
        { error: "That school year does not exist" },
        { status: 400 }
      );
    }

    const taken = await prisma.userProfile.findUnique({
      where: { profileName: loginId },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: "That login id is already taken" },
        { status: 400 }
      );
    }

    const profilePassword = await hashPassword(body.password);

    const child = await prisma.userProfile.create({
      data: {
        fName,
        mName: text(body.mName),
        lName,
        profileName: loginId,
        profilePassword,
        userType: "STUDENT",
        isActive: true,
        studentDetails: {
          create: {
            parentId: session.userId,
            studentYear: year.id,
            // Levels scale with the school year; harder rungs open as the
            // child moves up, so the parent need not grant them by hand.
            ...defaultEntitlementsForYear(year.name),
          },
        },
      },
      select: { id: true, profileName: true },
    });

    return NextResponse.json({ success: true, child }, { status: 201 });
  } catch (error) {
    console.error("Create child profile error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
