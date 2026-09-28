import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * How long a reset link stays usable.
 *
 * Long enough to walk to a laptop and find the email, short enough that a link
 * sitting in an inbox months later is worthless.
 */
export const RESET_VALID_MINUTES = 60;

/**
 * The raw token goes in the emailed URL and is never stored; only this hash
 * is. Anyone who reads the table therefore cannot mint a working link.
 *
 * SHA-256 rather than bcrypt because the token is 32 random bytes: there is no
 * guessable password in it to slow an attacker down over.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a fresh reset token for a user and retires any earlier ones.
 *
 * Retiring the old links matters: asking twice because the first email was
 * slow should not leave two working keys to the account.
 *
 * Returns the raw token, which the caller emails and then forgets.
 */
export async function issueResetToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_VALID_MINUTES * 60_000);

  await prisma.$transaction([
    // Mark outstanding links spent rather than deleting them, so the history
    // of who asked and when survives.
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    }),
  ]);

  return token;
}

export interface ResolvedToken {
  id: number;
  userId: number;
}

/**
 * The account a token belongs to, or null when the token is unknown, already
 * spent, or past its expiry.
 *
 * All three failures look identical on purpose - telling someone that a token
 * "has expired" rather than "is wrong" tells them the token was once real.
 */
export async function resolveResetToken(
  token: string | null | undefined
): Promise<ResolvedToken | null> {
  if (typeof token !== "string" || token.length < 16) return null;

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });

  if (!row) return null;
  if (row.usedAt !== null) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;

  return { id: row.id, userId: row.userId };
}

/** Marks a token spent. Called in the same transaction as the password change. */
export function spendTokenOp(tokenId: number) {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  });
}
