import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ownsChild, parentProfile } from "@/lib/parent";
import {
  appUrl,
  existingCustomerFor,
  stripe,
  subscriptionFor,
} from "@/lib/billing";

/**
 * Starts a monthly subscription for one child: posted by the Subscribe button
 * on the parent dashboard, answered with a redirect to Stripe Checkout.
 *
 * A plain form post rather than fetch, so the button needs no client code.
 */
export async function POST(request: NextRequest) {
  const base = appUrl(request.nextUrl.origin);
  const back = (status: string) =>
    NextResponse.redirect(`${base}/parent?billing=${status}`, 303);

  const session = await getSession();
  if (!session || session.userType !== "PARENT") {
    return NextResponse.redirect(`${base}/login`, 303);
  }

  const form = await request.formData();
  const studentId = Number(form.get("studentId"));
  if (!(await ownsChild(session.userId, studentId))) return back("error");

  // Already paying: send them to manage it rather than buy a second one.
  if ((await subscriptionFor(studentId)).isPaid) return back("already");

  const price = process.env.STRIPE_PRICE_ID;
  if (!price || !process.env.STRIPE_SECRET_KEY) return back("unavailable");

  try {
    const customer = await existingCustomerFor(session.userId);
    const email = customer
      ? undefined
      : (await parentProfile(session.userId))?.personalDetails?.emailAddress ??
        undefined;

    const metadata = {
      studentId: String(studentId),
      parentId: String(session.userId),
    };

    const checkout = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: String(studentId),
      metadata,
      // On the subscription too: renewals and cancellations arrive as
      // subscription events, and this is how they find the child.
      subscription_data: { metadata },
      ...(customer ? { customer } : email ? { customer_email: email } : {}),
      success_url: `${base}/parent?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/parent?billing=cancelled`,
    });

    return NextResponse.redirect(checkout.url!, 303);
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return back("error");
  }
}
