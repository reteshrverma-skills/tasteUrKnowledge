import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SESSION_MAX_AGE_SECONDS,
  hashPassword,
  signToken,
  startSingleSession,
} from "@/lib/auth";
import { normaliseProfileName, passwordProblem } from "@/lib/parent";
import { clientIp, hit, tooManyRequests } from "@/lib/rate-limit";
import { validCountryCode } from "@/lib/countries";
import security from "@/config/security.json";

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
  // Stops a bot flooding this form from one network address.
  const wait = hit(
    `register:ip:${clientIp(request)}`,
    security.register.maxPerIp,
    security.register.windowMinutes
  );
  if (wait > 0) return tooManyRequests(wait);

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
      acceptTerms,
      countryCode: submittedCountry,
    } = body;

    // Checked here as well as by the form, so an account cannot be created
    // without agreeing to the Terms & Copyright notice.
    if (acceptTerms !== true) {
      return NextResponse.json(
        { error: "Please agree to the Terms & Copyright notice to continue" },
        { status: 400 }
      );
    }

    if (!fName?.trim() || !lName?.trim()) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Must be a country from the country table, not just any two letters.
    const countryCode = await validCountryCode(submittedCountry);
    if (!countryCode) {
      return NextResponse.json(
        { error: "Please choose your country" },
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
        termsAcceptedAt: new Date(),
        countryCode,
        ...(emailAddress?.trim()
          ? { personalDetails: { create: { emailAddress: emailAddress.trim() } } }
          : {}),
      },
    });

    const sid = await startSingleSession(Number(user.id));

    const token = signToken({
      userId: Number(user.id),
      profileName: user.profileName,
      userType: user.userType,
      programme: user.programmeCode,
      sid,
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
      maxAge: SESSION_MAX_AGE_SECONDS,
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
