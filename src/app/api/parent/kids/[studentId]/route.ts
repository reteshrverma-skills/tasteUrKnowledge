import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endAllSessions, getSessionOrThrow, hashPassword } from "@/lib/auth";
import { ownsManagedChild, passwordProblem } from "@/lib/parent";
import { deleteChild, parseDeleteMode } from "@/lib/child-delete";
import { validProgrammeCode } from "@/lib/programme";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * A parent updating one of their children.
 *
 * ownsManagedChild is the whole guard: without it, editing the id in the URL would
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

    // A school pupil is managed by the school: the parent only views them.
    if (!(await ownsManagedChild(session.userId, studentId))) {
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

    // The programme changes only when the form sends one (it is not shown
    // while a single programme is offered), and only to an active one.
    let programmeCode: string | undefined;
    if (body.programmeCode !== undefined && body.programmeCode !== null) {
      const valid = await validProgrammeCode(body.programmeCode);
      if (!valid) {
        return NextResponse.json(
          { error: "Please choose a programme" },
          { status: 400 }
        );
      }
      programmeCode = valid;
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
        ...(programmeCode ? { programmeCode } : {}),
        studentDetails: { update: { studentYear: year.id } },
      },
    });

    // A parent changing the child's password signs the child out everywhere.
    if (profilePassword) await endAllSessions(studentId);

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

/**
 * A parent deleting one of their children - see lib/child-delete.ts for what
 * each mode removes. The body must repeat the child's login id, so a stray
 * request cannot delete a child the parent did not name.
 */
export async function DELETE(
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

    // A school pupil is managed by the school: the parent only views them.
    if (!(await ownsManagedChild(session.userId, studentId))) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const mode = parseDeleteMode(body.mode);
    if (!mode) {
      return NextResponse.json(
        { error: "Choose how to delete the profile" },
        { status: 400 }
      );
    }

    const child = await prisma.userProfile.findUnique({
      where: { id: studentId },
      select: { profileName: true },
    });
    if (
      !child ||
      text(body.confirm)?.toLowerCase() !== child.profileName.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Type the child's login id exactly to confirm" },
        { status: 400 }
      );
    }

    await deleteChild(studentId, mode);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete child profile error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Could not delete the profile. Nothing was removed." },
      { status: 500 }
    );
  }
}
