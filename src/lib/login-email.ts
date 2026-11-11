import { prisma } from "@/lib/prisma";

/**
 * The login email on userProfile (migration 044): lower-case, unique, and
 * never set for a student. These helpers keep every write path consistent.
 */

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The email as stored for login, or null when blank or not email-shaped. */
export function loginEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_SHAPE.test(email) ? email : null;
}

/** Whether another account already signs in with this email. */
export async function loginEmailTaken(email: string, exceptId?: bigint | number): Promise<boolean> {
  const taken = await prisma.userProfile.findUnique({
    where: { email },
    select: { id: true },
  });
  return taken !== null && (exceptId === undefined || taken.id !== BigInt(exceptId));
}

export const EMAIL_TAKEN_MESSAGE = "This email is already used by another account";
