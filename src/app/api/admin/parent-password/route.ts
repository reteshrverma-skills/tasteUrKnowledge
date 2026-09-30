import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, hashPassword } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { passwordProblem } from "@/lib/parent";

/**
 * Admin-only: reset a parent's password.
 *
 * The proxy already keeps non-admins out of /admin and /api/admin, but the
 * role is re-checked here - an API route must not rely on the gate in front
 * of it being the only thing standing between a student and this endpoint.
 *
 * Only PARENT accounts are targetable. A parent resets their own child's
 * password from Kids Profile; admins step in for the parent's own login, which
 * has no other recovery path an admin controls.
 */
async function requireAdmin() {
  const session = await getSessionOrThrow();
  if (session.userType !== "ADMIN") {
    throw new Error("Forbidden");
  }
}

/** The parents an admin can pick from. */
export async function GET() {
  try {
    await requireAdmin();

    const parents = await prisma.userProfile.findMany({
      where: { userType: "PARENT" },
      orderBy: { profileName: "asc" },
      select: {
        id: true,
        profileName: true,
        fName: true,
        mName: true,
        lName: true,
        isActive: true,
      },
    });

    return NextResponse.json(
      parents.map((p) => ({
        id: p.id,
        profileName: p.profileName,
        name: displayName(p),
        isActive: p.isActive,
      })),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: authError(error) },
      { status: authStatus(error) }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parentId = Number(body.parentId);

    if (!Number.isInteger(parentId)) {
      return NextResponse.json(
        { error: "Choose a parent" },
        { status: 400 }
      );
    }

    const problem = passwordProblem(body.password, body.confirmPassword);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    // Only a PARENT account can be reset here; anything else is not found, so
    // the endpoint cannot be turned on admins or students by changing the id.
    const parent = await prisma.userProfile.findFirst({
      where: { id: parentId, userType: "PARENT" },
      select: { id: true, profileName: true },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "No parent account with that id" },
        { status: 404 }
      );
    }

    const profilePassword = await hashPassword(body.password);

    await prisma.$transaction([
      prisma.userProfile.update({
        where: { id: parent.id },
        data: { profilePassword },
      }),
      // Any outstanding reset link for this parent dies with the change, so an
      // old emailed link cannot undo what the admin just set.
      prisma.passwordResetToken.updateMany({
        where: { userId: parent.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json(
      { success: true, profileName: parent.profileName },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: authError(error) },
      { status: authStatus(error) }
    );
  }
}

function authError(error: unknown): string {
  if (error instanceof Error && error.message === "Forbidden") return "Forbidden";
  if (error instanceof Error && error.message === "Unauthorized")
    return "Unauthorized";
  console.error("Admin parent-password error:", error);
  return "Internal server error";
}

function authStatus(error: unknown): number {
  if (error instanceof Error && error.message === "Forbidden") return 403;
  if (error instanceof Error && error.message === "Unauthorized") return 401;
  return 500;
}
