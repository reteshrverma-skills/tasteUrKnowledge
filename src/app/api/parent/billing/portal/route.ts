import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ownsChild } from "@/lib/parent";
import { appUrl, stripe, subscriptionFor } from "@/lib/billing";

/**
 * Opens Stripe's billing portal for the customer paying for this child, where
 * a parent can update their card, see invoices or cancel.
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

  const { subscriptionId } = await subscriptionFor(studentId);
  if (!subscriptionId || !process.env.STRIPE_SECRET_KEY) return back("error");

  try {
    const sub = await stripe().subscriptions.retrieve(subscriptionId);
    const portal = await stripe().billingPortal.sessions.create({
      customer: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      return_url: `${base}/parent`,
    });
    return NextResponse.redirect(portal.url, 303);
  } catch (error) {
    console.error("Stripe portal error:", error);
    return back("error");
  }
}
