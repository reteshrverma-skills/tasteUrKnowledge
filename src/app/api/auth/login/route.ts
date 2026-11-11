import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { accountBlocked, signedInResponse } from "@/lib/login-complete";
import {
  blockedFor,
  clear,
  clientIp,
  record,
  tooManyRequests,
} from "@/lib/rate-limit";
import security from "@/config/security.json";
import { loginEmail } from "@/lib/login-email";

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

    // Find the account by its user ID or, for anyone but a student, by email.
    // A user ID can never contain "@", so an "@" means an email address.
    const identifier = String(profileName).trim();
    // The login email is unique and lower-case, and never set for a student
    // (migration 044); the userType check is a second line behind that rule.
    let user;
    if (identifier.includes("@")) {
      const email = loginEmail(identifier);
      const found = email ? await prisma.userProfile.findUnique({ where: { email } }) : null;
      user = found && found.userType !== "STUDENT" ? found : null;
    } else {
      user = await prisma.userProfile.findUnique({
        where: { profileName: identifier },
      });
    }

    if (!user) {
      // Counted like a wrong password, so the limit gives away nothing about
      // which login IDs exist.
      record(accountKey, LIMITS.lockoutMinutes);
      return NextResponse.json(
        { error: "Invalid user ID or password" },
        { status: 401 }
      );
    }

    const blocked = await accountBlocked(user);
    if (blocked) return blocked;

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

    return await signedInResponse(user);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
