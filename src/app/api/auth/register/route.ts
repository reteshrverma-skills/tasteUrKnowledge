import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { normaliseProfileName, passwordProblem } from "@/lib/parent";

/**
 * Signing up creates a PARENT account, and only a PARENT account.
 *
 * Children are not registered here and no student user id is asked for: a
 * parent signs up for themselves, then creates each child from Kids Profile,
 * which is what links the two (userStudentDetails.parentId). Student accounts
 * therefore always have a parent, and admins are seeded or made in the admin
 * panel.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fName,
      mName,
      lName,
      profileName,
      password,
      confirmPassword,
      emailAddress,
    } = body;

    if (!fName?.trim() || !lName?.trim()) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const loginId = normaliseProfileName(profileName);
    if (!loginId) {
      return NextResponse.json(
        {
          error:
            "User ID must be 3-30 characters, using letters, numbers, dot, dash or underscore",
        },
        { status: 400 }
      );
    }

    const problem = passwordProblem(password, confirmPassword);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const existingUser = await prisma.userProfile.findUnique({
      where: { profileName: loginId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This user ID is already taken" },
        { status: 400 }
      );
    }

    const profilePassword = await hashPassword(password);
    const user = await prisma.userProfile.create({
      data: {
        fName: fName.trim(),
        mName: mName?.trim() || null,
        lName: lName.trim(),
        profileName: loginId,
        profilePassword,
        userType: "PARENT",
        isActive: true,
        ...(emailAddress?.trim()
          ? { personalDetails: { create: { emailAddress: emailAddress.trim() } } }
          : {}),
      },
    });

    const token = signToken({
      userId: user.id,
      profileName: user.profileName,
      userType: user.userType,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          profileName: user.profileName,
          userType: user.userType,
          fName: user.fName,
          lName: user.lName,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
