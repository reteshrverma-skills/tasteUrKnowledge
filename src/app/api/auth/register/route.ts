import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SESSION_MAX_AGE_SECONDS,
  hashPassword,
  homePathFor,
  signToken,
  startSingleSession,
} from "@/lib/auth";
import { normaliseProfileName, passwordProblem } from "@/lib/parent";
import { clientIp, hit, tooManyRequests } from "@/lib/rate-limit";
import { validCountryCode } from "@/lib/countries";
import { EMAIL_TAKEN_MESSAGE, loginEmail, loginEmailTaken } from "@/lib/login-email";
import { DEFAULT_PROGRAMME, validProgrammeCode } from "@/lib/programme";
import { defaultEntitlementsForYear } from "@/lib/student";
import security from "@/config/security.json";

/**
 * Signing up creates one of two accounts, by the programme chosen:
 *
 *  - Grammar School (11+): a PARENT account. The parent then creates each
 *    child from Children Profile, which links the two
 *    (userStudentDetails.parentId).
 *  - GCSE / A-Level: a STUDENT account for the student themselves, with no
 *    parent. They sign in with their user ID.
 *
 * Admins are seeded or made in the admin panel.
 */

/** A free user ID made from an email's local part, e.g. "jane.doe", "jane.doe2". */
async function userIdFromEmail(email: string): Promise<string> {
  let base = email.split("@")[0].replace(/[^a-z0-9._-]/g, "").slice(0, 26);
  if (base.length < 3) base = `${base}user`.slice(0, 26);
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}${n}`;
    const taken = await prisma.userProfile.findUnique({
      where: { profileName: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
}
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

    // Grammar School 11+, GCSE or A-Level. Sign-up is open to all three,
    // including programmes still marked inactive (content coming soon).
    const programmeCode = await validProgrammeCode(body.programmeCode, {
      includeInactive: true,
    });
    if (!programmeCode) {
      return NextResponse.json(
        { error: "Please choose your academic programme" },
        { status: 400 }
      );
    }

    if (!fName?.trim()) {
      return NextResponse.json(
        { error: "First name is required" },
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

    // GCSE and A-Level sign-ups are the students themselves; Grammar School
    // sign-ups are parents, who add their children afterwards.
    const isStudent = programmeCode !== DEFAULT_PROGRAMME;

    const email = loginEmail(emailAddress);
    if (!email) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // A student signs in with their user ID only (a student never has a login
    // email, migration 044), so they must choose one. A parent may leave it
    // blank and sign in with their email; a user ID is then made from it.
    const typedId = typeof profileName === "string" ? profileName.trim() : "";
    if (isStudent && !typedId) {
      return NextResponse.json(
        { error: "Please choose a user ID - you will sign in with it" },
        { status: 400 }
      );
    }
    let loginId: string | null = null;
    if (typedId) {
      loginId = normaliseProfileName(typedId);
      if (!loginId) {
        return NextResponse.json(
          {
            error:
              "User ID must be 3-30 characters, using letters, numbers, dot, dash or underscore",
          },
          { status: 400 }
        );
      }
    }

    const problem = passwordProblem(password, confirmPassword);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    if (loginId) {
      const existingUser = await prisma.userProfile.findUnique({
        where: { profileName: loginId },
        select: { id: true },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "This user ID is already taken" },
          { status: 400 }
        );
      }
    }

    // For a parent the email doubles as a login, so it must not belong to
    // another account. For a student it is a contact email only.
    if (!isStudent && (await loginEmailTaken(email))) {
      return NextResponse.json({ error: EMAIL_TAKEN_MESSAGE }, { status: 400 });
    }

    const profilePassword = await hashPassword(password);
    const user = await prisma.userProfile.create({
      data: {
        fName: fName.trim(),
        mName: mName?.trim() || null,
        lName: lName?.trim() || null,
        profileName: loginId ?? (await userIdFromEmail(email)),
        profilePassword,
        userType: isStudent ? "STUDENT" : "PARENT",
        isActive: true,
        termsAcceptedAt: new Date(),
        countryCode,
        programmeCode,
        email: isStudent ? null : email,
        personalDetails: { create: { emailAddress: emailAddress.trim() } },
        // A self-registered student has no parent and no school year; GCSE
        // and A-Level students get every level from the start.
        ...(isStudent
          ? { studentDetails: { create: defaultEntitlementsForYear("Year 10") } }
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
        redirect: homePathFor(user.userType),
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
