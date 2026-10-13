import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { stripe, subscriptionFor } from "@/lib/billing";

/**
 * A parent removing a child, in one of two ways:
 *
 * - "full": the profile and everything recorded against it. The English,
 *   Maths and Non-Verbal trackers, personal details, payments and login
 *   history all cascade from userProfile. The Verbal Reasoning tables have no
 *   foreign key to userProfile, so their rows are deleted explicitly.
 *
 * - "keep-tests": the child stops existing for the parent and can no longer
 *   log in, but their test history stays. Every tracker cascades from the
 *   profile row, so that row cannot be deleted without losing the tests;
 *   instead it is anonymised - name and contact details wiped, login id
 *   released, password scrambled, account deactivated - and unlinked from
 *   the parent.
 *
 * Either way a live subscription is cancelled first, so a parent is never
 * billed for a child they removed. If Stripe refuses, nothing is deleted.
 */
export type DeleteMode = "full" | "keep-tests";

export function parseDeleteMode(value: unknown): DeleteMode | null {
  return value === "full" || value === "keep-tests" ? value : null;
}

async function cancelSubscription(studentId: number) {
  const { subscriptionId, isPaid } = await subscriptionFor(studentId);
  if (!subscriptionId || !isPaid) return;

  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  if (sub.status !== "canceled") {
    await stripe().subscriptions.cancel(subscriptionId);
  }
}

export async function deleteChild(studentId: number, mode: DeleteMode) {
  await cancelSubscription(studentId);

  if (mode === "full") {
    const sid = BigInt(studentId);
    await prisma.$transaction([
      // Answers before rounds: testTrackerVR references testTrackerVRMain.
      prisma.testTrackerVr.deleteMany({ where: { studentId: sid } }),
      prisma.testTrackerVrMain.deleteMany({ where: { studentId: sid } }),
      prisma.userProfile.delete({ where: { id: studentId } }),
    ]);
    return;
  }

  // Unguessable, so the scrambled password can never be logged in with.
  const scrambled = await hashPassword(randomBytes(32).toString("hex"));

  await prisma.$transaction([
    prisma.userProfile.update({
      where: { id: studentId },
      data: {
        fName: "Deleted",
        mName: null,
        lName: "profile",
        // Frees the child's login id for reuse; still unique.
        profileName: `deleted-${studentId}-${Date.now()}`,
        profilePassword: scrambled,
        isActive: false,
      },
    }),
    prisma.userStudentDetails.update({
      where: { studentId },
      data: {
        parentId: null,
        schoolAdd1: null,
        schoolAdd2: null,
        schoolAdd3: null,
        schoolCity: null,
        schoolCountry: null,
      },
    }),
    prisma.userPersonalDetails.deleteMany({
      where: { userDetailsId: studentId },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: studentId } }),
  ]);
}
