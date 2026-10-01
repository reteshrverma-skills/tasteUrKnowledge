import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, hashPassword } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { passwordProblem } from "@/lib/parent";
import type { UserType } from "@/lib/auth";

/**
 * Admin password-reset, shared by the parent and admin reset endpoints.
 *
 * Each endpoint is pinned to a single target role and passes it here, so one
 * endpoint can only ever touch parents and the other only admins - the role is
 * never taken from the request. That keeps the two surfaces separately
 * auditable while the logic lives in one place.
 *
 * The proxy keeps non-admins out of /admin pages, but NOT out of /api/admin,
 * so the admin check here is the real guard on these endpoints.
 */
async function requireAdmin() {
  const session = await getSessionOrThrow();
  if (session.userType !== "ADMIN") throw new Error("Forbidden");
}

/** The accounts of one role an admin may pick from. */
export async function listAccounts(role: UserType) {
  await requireAdmin();
  const rows = await prisma.userProfile.findMany({
    where: { userType: role },
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
  return rows.map((r) => ({
    id: r.id,
    profileName: r.profileName,
    name: displayName(r),
    isActive: r.isActive,
  }));
}

export async function resetAccountPassword(
  request: NextRequest,
  role: UserType
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const body = await request.json();
    const accountId = Number(body.accountId);

    if (!Number.isInteger(accountId)) {
      return NextResponse.json({ error: "Choose an account" }, { status: 400 });
    }

    const problem = passwordProblem(body.password, body.confirmPassword);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    // Pinned to the role this endpoint serves. An id of another role is "not
    // found", so the parent endpoint can never be turned on an admin, or back.
    const account = await prisma.userProfile.findFirst({
      where: { id: accountId, userType: role },
      select: { id: true, profileName: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: `No ${role.toLowerCase()} account with that id` },
        { status: 404 }
      );
    }

    const profilePassword = await hashPassword(body.password);

    await prisma.$transaction([
      prisma.userProfile.update({
        where: { id: account.id },
        data: { profilePassword },
      }),
      // Any outstanding reset link for this account dies with the change.
      prisma.passwordResetToken.updateMany({
        where: { userId: account.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json(
      { success: true, profileName: account.profileName },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Account password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
