import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

/**
 * Per-child monthly subscriptions through Stripe Checkout.
 *
 * Stripe is the record of truth; userPaymentDetails holds a copy per child
 * (paymentId = the Stripe subscription id, profileActive = paid-up-to date)
 * so the access gate is one local query rather than a call to Stripe on every
 * page. The copy is refreshed by the webhook and again when a parent comes
 * back from Checkout, so it does not depend on the webhook alone.
 */

let client: Stripe | null = null;

/** Created on first use, so a build without Stripe keys still succeeds. */
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key);
  return client;
}

/**
 * Whether an unpaid child is locked out. Off until set to "true", so
 * deploying this does not lock out children whose parents have not yet had
 * the chance to subscribe.
 */
export function paymentsEnforced(): boolean {
  return process.env.PAYMENTS_ENFORCED === "true";
}

export function appUrl(fallbackOrigin: string): string {
  return (process.env.APP_URL ?? fallbackOrigin).replace(/\/$/, "");
}

export interface ChildSubscription {
  subscriptionId: string | null;
  /** Last day the child is paid up to; null when never subscribed. */
  activeUntil: Date | null;
  isPaid: boolean;
}

function startOfToday(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

/** The child's most recent Stripe subscription, as last recorded. */
export async function subscriptionFor(
  studentId: number
): Promise<ChildSubscription> {
  const row = await prisma.userPaymentDetails.findFirst({
    where: { userProfileId: studentId, paymentId: { startsWith: "sub_" } },
    orderBy: { id: "desc" },
    select: { paymentId: true, profileActive: true },
  });

  const activeUntil = row?.profileActive ?? null;
  return {
    subscriptionId: row?.paymentId ?? null,
    activeUntil,
    isPaid: activeUntil !== null && activeUntil >= startOfToday(),
  };
}

/**
 * Copies a Stripe subscription onto the child it was bought for. A live
 * subscription is paid up to the end of its current period; an ended one up
 * to the day it ended.
 */
export async function recordSubscription(sub: Stripe.Subscription) {
  const studentId = Number(sub.metadata?.studentId);
  if (!Number.isInteger(studentId) || studentId <= 0) return;

  const item = sub.items.data[0];
  const live = ["active", "trialing", "past_due"].includes(sub.status);
  const until = live
    ? item?.current_period_end
    : sub.ended_at ?? sub.canceled_at ?? null;
  const profileActive = until ? new Date(until * 1000) : null;
  const amount = item?.price.unit_amount;
  const paymentAmount = amount != null ? amount / 100 : null;

  const existing = await prisma.userPaymentDetails.findFirst({
    where: { userProfileId: studentId, paymentId: sub.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.userPaymentDetails.update({
      where: { id: existing.id },
      data: { profileActive, paymentAmount },
    });
  } else {
    await prisma.userPaymentDetails.create({
      data: {
        userProfileId: studentId,
        paymentId: sub.id,
        paymentAmount,
        profileActive,
      },
    });
  }
}

/**
 * The Stripe customer already paying for another of this parent's children,
 * so one parent stays one customer with one billing portal.
 */
export async function existingCustomerFor(
  parentId: number
): Promise<string | null> {
  const row = await prisma.userPaymentDetails.findFirst({
    where: {
      paymentId: { startsWith: "sub_" },
      profile: { studentDetails: { parentId } },
    },
    orderBy: { id: "desc" },
    select: { paymentId: true },
  });
  if (!row?.paymentId) return null;

  const sub = await stripe().subscriptions.retrieve(row.paymentId);
  return typeof sub.customer === "string" ? sub.customer : sub.customer.id;
}
