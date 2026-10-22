import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { recordLogin } from "@/lib/login-session";
import {
  blockedFor,
  clear,
  clientIp,
  record,
  tooManyRequests,
} from "@/lib/rate-limit";
import security from "@/config/security.json";

const LIMITS = security.login;

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

    // Password guessing: one login ID is locked after too many wrong
    // passwords, and one network address after too many attempts of any kind.
    // Checked before the database or bcrypt, so a flood costs almost nothing.
    const ipKey = `login:ip:${clientIp(request)}`;
    const accountKey = `login:account:${String(profileName).trim().toLowerCase()}`;
    const wait = Math.max(
      blockedFor(accountKey, LIMITS.maxFailuresPerAccount),
      blockedFor(ipKey, LIMITS.maxAttemptsPerIp)
    );
    if (wait > 0) return tooManyRequests(wait);
    record(ipKey, LIMITS.windowMinutes);

    // Find user by their login user id
    const user = await prisma.userProfile.findUnique({
      where: { profileName },
    });

    if (!user) {
      // Counted like a wrong password, so the limit gives away nothing about
      // which login IDs exist.
      record(accountKey, LIMITS.lockoutMinutes);
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
      record(accountKey, LIMITS.lockoutMinutes);
      return NextResponse.json(
        { error: "Invalid user ID or password" },
        { status: 401 }
      );
    }

    clear(accountKey);

    // Create token and set cookie
    const token = signToken({
      userId: Number(user.id),
      profileName: user.profileName,
      userType: user.userType,
    });

    // Opens the audit row. Non-fatal: a tracking failure must not block login.
    await recordLogin(Number(user.id));

    // Each account type has its own home: admins the admin panel, parents the
    // parent dashboard, students the subject tiles.
    const destination =
      user.userType === "ADMIN"
        ? "/admin"
        : user.userType === "PARENT"
        ? "/parent"
        : "/dashboard";

    // Return the destination as data and let the client navigate, rather than
    // issuing an HTTP redirect. A server-built redirect has to name an
    // absolute URL, and behind a reverse proxy (Azure App Service) the only
    // host the server sees is its own internal one - so the browser was being
    // sent to http://localhost:8080/dashboard, which it cannot reach. Handing
    // back a relative path sidesteps that entirely, and matches how register
    // already works.
    const response = NextResponse.json(
      { success: true, redirect: destination },
      { status: 200 }
    );

    // Set cookie on response
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
