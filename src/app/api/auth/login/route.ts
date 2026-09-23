import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileName, password } = body;

    if (!profileName || !password) {
      return NextResponse.json(
        { error: "User ID and password are required" },
        { status: 400 }
      );
    }

    // Find user by their login user id
    const user = await prisma.userProfile.findUnique({
      where: { profileName },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid user ID or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "This account is inactive. Please contact an administrator." },
        { status: 403 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.profilePassword);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid user ID or password" },
        { status: 401 }
      );
    }

    // Create token and set cookie
    const token = signToken({
      userId: user.id,
      profileName: user.profileName,
      userType: user.userType,
    });

    // Each account type has its own home: admins the admin panel, parents the
    // parent dashboard, students the subject tiles.
    const destination =
      user.userType === "ADMIN"
        ? "/admin"
        : user.userType === "PARENT"
        ? "/parent"
        : "/dashboard";
    const response = NextResponse.redirect(new URL(destination, request.url), {
      status: 303,
    });

    // Set cookie on response
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
