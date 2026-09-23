import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

/**
 * The key every session token is signed with.
 *
 * It comes from the environment and has no fallback on purpose. A default
 * here would be published the moment this file is pushed, and anyone holding
 * it can mint a token for any account - including an admin - without ever
 * knowing a password. Failing to start is the safe outcome; quietly signing
 * with a known string is not.
 */
const secretFromEnv = process.env.JWT_SECRET;

if (!secretFromEnv) {
  throw new Error(
    "JWT_SECRET is not set. Add it to .env.local (any long random string) before starting the app."
  );
}

// Narrowed once here so sign() and verify() below see a plain string; the
// check above cannot narrow a module constant inside a function body.
const JWT_SECRET: string = secretFromEnv;

const JWT_EXPIRY = "7d";
const COOKIE_NAME = "token";

export type UserType = "STUDENT" | "PARENT" | "ADMIN";

export interface Session {
  /** userProfile.id */
  userId: number;
  /** userProfile.profileName - the login user id */
  profileName: string;
  userType: UserType;
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function signToken(data: Session): string {
  return jwt.sign(data, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

const USER_TYPES: readonly string[] = ["STUDENT", "PARENT", "ADMIN"];

/**
 * A signature check is not enough: tokens issued before the userProfile
 * migration are still validly signed but carry the old `{ userId: cuid,
 * email, role }` payload. Letting one through would leave the holder with an
 * undefined userType - not an admin, and unable to reach /login to replace it.
 * Anything that is not the current shape is treated as no session at all.
 */
function isSession(payload: unknown): payload is Session {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.userId === "number" &&
    typeof p.profileName === "string" &&
    typeof p.userType === "string" &&
    USER_TYPES.includes(p.userType)
  );
}

export function verifyToken(token: string): Session | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return isSession(payload) ? payload : null;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function getSessionOrThrow(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
