import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { recordSubscription, stripe } from "@/lib/billing";

/**
 * Stripe's notifications about subscriptions: a new one, a renewal, a failed
 * payment, a cancellation. Each is copied onto the child it was bought for.
 *
 * The signature check needs the body exactly as sent, so it is read as text.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      await request.text(),
      signature,
      secret
    );
  } catch (error) {
    console.error("Stripe webhook signature failed:", error);
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const subId = event.data.object.subscription;
        if (subId) {
          await recordSubscription(
            await stripe().subscriptions.retrieve(
              typeof subId === "string" ? subId : subId.id
            )
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await recordSubscription(event.data.object);
        break;
    }
  } catch (error) {
    // A 500 makes Stripe retry, which is what we want for a database hiccup.
    console.error("Stripe webhook handling failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
