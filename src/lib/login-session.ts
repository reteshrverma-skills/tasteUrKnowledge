import { prisma } from "@/lib/prisma";

/**
 * Login / logout audit trail.
 *
 * Tracking must never get in the way of signing in or out, so every call here
 * swallows its own errors - a failed insert costs an audit row, not a login.
 */

/** Opens a session row when a login succeeds. */
export async function recordLogin(userId: number): Promise<void> {
  try {
    await prisma.userLoginSession.create({ data: { userId } });
  } catch (error) {
    console.error("Failed to record login:", error);
  }
}

/**
 * Closes the user's most recent still-open session on an explicit logout.
 *
 * Exact for the usual one-device case. With two devices open at once this
 * closes the newer of the two open rows, which is close enough for an audit
 * log and avoids carrying a session id in the cookie.
 */
export async function recordLogout(userId: number): Promise<void> {
  try {
    const open = await prisma.userLoginSession.findFirst({
      where: { userId, logoutAt: null },
      orderBy: { loginAt: "desc" },
      select: { id: true },
    });
    if (open) {
      await prisma.userLoginSession.update({
        where: { id: open.id },
        data: { logoutAt: new Date(), endReason: "logout" },
      });
    }
  } catch (error) {
    console.error("Failed to record logout:", error);
  }
}
