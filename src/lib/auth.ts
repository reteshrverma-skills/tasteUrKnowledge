import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import sessionConfig from "@/config/session.json";
import { prisma } from "@/lib/prisma";

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

/**
 * How long a session lasts without activity (src/config/session.json). The
 * token expires on its own after this long; while the user is active the
 * browser renews it through /api/auth/keepalive, so an idle session ends on
 * the server even if the page is left open.
 */
export const SESSION_MAX_AGE_SECONDS = sessionConfig.idleTimeoutMinutes * 60;

const JWT_EXPIRY = SESSION_MAX_AGE_SECONDS;
const COOKIE_NAME = "token";

export type UserType =
  | "STUDENT"
  | "PARENT"
  | "ADMIN"
  | "PRODUCT_DIRECTOR"
  | "SCHOOL_ADMIN"
  | "TEACHER";

/**
 * Where each account type lands after login, and where it is sent when it
 * opens a page that is not for it.
 */
export function homePathFor(userType: UserType): string {
  switch (userType) {
    case "ADMIN":
      return "/admin";
    case "PARENT":
      return "/parent";
    case "PRODUCT_DIRECTOR":
      return "/director";
    case "SCHOOL_ADMIN":
      return "/school";
    case "TEACHER":
      return "/teacher";
    default:
      return "/dashboard";
  }
}

export interface Session {
  /** userProfile.id */
  userId: number;
  /** userProfile.profileName - the login user id */
  profileName: string;
  userType: UserType;
  /**
   * The programme this account practises: "GRAMMAR", "GCSE" or "ALEVEL".
   * Carried in the token so scoping a query costs no extra lookup.
   */
  programme: string;
  /**
   * Which login this token belongs to. Only the account's current one is
   * accepted, so one account has one session at a time. Missing on tokens
   * issued before single sessions existed.
   */
  sid?: string;
  /**
   * Set when a teacher opened this pupil on a classroom device: the teacher's
   * userProfile.id and the classroomSession row. Logging out of such a session
   * asks for the teacher's PIN and returns the device to the teacher.
   */
  teacherId?: number;
  classroomId?: number;
}

/** Tokens issued before programmes existed belong to Grammar School. */
export const DEFAULT_PROGRAMME = "GRAMMAR";

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

/** False for an account with no password (a school pupil): it never signs in. */
export async function verifyPassword(
  password: string,
  hash: string | null
): Promise<boolean> {
  if (!hash) return false;
  return bcryptjs.compare(password, hash);
}

export function signToken(data: Session): string {
  return jwt.sign(data, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

const USER_TYPES: readonly string[] = [
  "STUDENT",
  "PARENT",
  "ADMIN",
  "PRODUCT_DIRECTOR",
  "SCHOOL_ADMIN",
  "TEACHER",
];

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
    if (!isSession(payload)) return null;
    return {
      userId: payload.userId,
      profileName: payload.profileName,
      userType: payload.userType,
      programme:
        typeof payload.programme === "string" && payload.programme
          ? payload.programme
          : DEFAULT_PROGRAMME,
      ...(typeof payload.sid === "string" && payload.sid
        ? { sid: payload.sid }
        : {}),
      ...(typeof payload.teacherId === "number" &&
      typeof payload.classroomId === "number"
        ? { teacherId: payload.teacherId, classroomId: payload.classroomId }
        : {}),
    };
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
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/* ------------------------------------------------------------------ */
/* One session per account                                             */
/* ------------------------------------------------------------------ */

/**
 * The current session key per account, cached so checking it costs a
 * database read at most every 30 seconds per user, not one per request.
 * On globalThis so routes and the proxy share it. With several app instances
 * a login elsewhere is noticed within the 30 seconds.
 */
type KeyEntry = {
  key: string | null;
  active: boolean;
  /** Teachers: any number of sessions, so the key is not checked. */
  multi: boolean;
  at: number;
};
const KEY_TTL_MS = 30_000;
const keyCache: Map<number, KeyEntry> = ((
  globalThis as unknown as { __sessionKeys?: Map<number, KeyEntry> }
).__sessionKeys ??= new Map());

async function currentKey(userId: number): Promise<KeyEntry> {
  const cached = keyCache.get(userId);
  if (cached && Date.now() - cached.at < KEY_TTL_MS) return cached;
  const row = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: {
      activeSessionKey: true,
      isActive: true,
      allowMultipleSessions: true,
      school: { select: { isActive: true } },
    },
  });
  const entry = {
    key: row?.activeSessionKey ?? null,
    // Switching a school off signs out its staff and pupils too.
    active: Boolean(row?.isActive) && row?.school?.isActive !== false,
    multi: Boolean(row?.allowMultipleSessions),
    at: Date.now(),
  };
  keyCache.set(userId, entry);
  return entry;
}

/**
 * Whether this token is the account's one live session. False once the
 * account signs in elsewhere, logs out, resets its password or is
 * deactivated. A token from before single sessions (no sid) is honoured
 * only until the account next signs in. A teacher's tokens (several devices
 * at once) are honoured while the account is active and unexpired.
 */
export async function isCurrentSession(session: Session): Promise<boolean> {
  const { key, active, multi } = await currentKey(session.userId);
  if (!active) return false;
  if (multi) return true;
  if (!key) return !session.sid;
  return session.sid === key;
}

/**
 * Starts the account's only session: a fresh key replaces any earlier one,
 * which ends the session on any other device. Returns the key for the token.
 */
export async function startSingleSession(userId: number): Promise<string> {
  const key = randomUUID();
  await prisma.userProfile.update({
    where: { id: userId },
    data: { activeSessionKey: key },
  });
  keyCache.set(userId, { key, active: true, multi: false, at: Date.now() });
  return key;
}

/** Ends the account's session everywhere: logout, password reset. */
export async function endAllSessions(userId: number): Promise<void> {
  await prisma.userProfile.update({
    where: { id: userId },
    data: { activeSessionKey: null },
  });
  keyCache.delete(userId);
}

/**
 * The signed-in user, or null. A token that verifies but is no longer the
 * account's current session (signed in elsewhere, logged out, password reset)
 * counts as no session.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = verifyToken(token);
  if (!session) return null;
  return (await isCurrentSession(session)) ? session : null;
}

export async function getSessionOrThrow(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
