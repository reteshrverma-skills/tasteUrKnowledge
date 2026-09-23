import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, hashPassword } from "@/lib/auth";
import { ownsChild, passwordProblem } from "@/lib/parent";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * A parent updating one of their children.
 *
 * ownsChild is the whole guard: without it, editing the id in the URL would
 * let one parent rewrite another parent's child. The login id is deliberately
 * not editable - it is what the child signs in with, and the tracker tables
 * key off the profile, not the name.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "PARENT") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { studentId: raw } = await params;
    const studentId = Number(raw);

    if (!(await ownsChild(session.userId, studentId))) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
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

    const studentYear = text(body.studentYear);
    if (!studentYear) {
      return NextResponse.json(
        { error: "Please choose a school year" },
        { status: 400 }
      );
    }

    const year = await prisma.year.findUnique({
      where: { id: studentYear },
      select: { id: true },
    });
    if (!year) {
      return NextResponse.json(
        { error: "That school year does not exist" },
        { status: 400 }
      );
    }

    // Only set a password when one was actually typed; an untouched form
    // leaves the child's existing password alone.
    let profilePassword: string | undefined;
    if (text(body.password) || text(body.confirmPassword)) {
      const problem = passwordProblem(body.password, body.confirmPassword);
      if (problem) {
        return NextResponse.json({ error: problem }, { status: 400 });
      }
      profilePassword = await hashPassword(body.password);
    }

    await prisma.userProfile.update({
      where: { id: studentId },
      data: {
        fName,
        mName: text(body.mName),
        lName,
        isActive: body.isActive !== false,
        ...(profilePassword ? { profilePassword } : {}),
        studentDetails: { update: { studentYear: year.id } },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Update child profile error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
