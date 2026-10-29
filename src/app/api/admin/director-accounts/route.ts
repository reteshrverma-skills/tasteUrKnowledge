import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, hashPassword } from "@/lib/auth";
import { listAccounts } from "@/lib/admin-password";
import { normaliseProfileName, passwordProblem } from "@/lib/parent";

/**
 * Admin-only: Product Director accounts.
 *
 * GET lists them; POST creates one (name, login ID, password). Passwords are
 * reset at /api/admin/director-password. Only ever creates PRODUCT_DIRECTOR
 * accounts.
 */
export async function GET() {
  const directors = await listAccounts("PRODUCT_DIRECTOR").catch(() => null);
  if (!directors) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(directors, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const text = (value: unknown) =>
      typeof value === "string" && value.trim() ? value.trim().slice(0, 100) : null;
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
            "Login ID must be 3-30 characters, using letters, numbers, dot, dash or underscore",
        },
        { status: 400 }
      );
    }

    const problem = passwordProblem(body.password, body.confirmPassword);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const taken = await prisma.userProfile.findUnique({
      where: { profileName: loginId },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: "That login ID is already taken" },
        { status: 400 }
      );
    }

    const created = await prisma.userProfile.create({
      data: {
        fName,
        lName,
        profileName: loginId,
        profilePassword: await hashPassword(body.password),
        userType: "PRODUCT_DIRECTOR",
        isActive: true,
      },
      select: { profileName: true },
    });

    return NextResponse.json({ profileName: created.profileName }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create product director error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
