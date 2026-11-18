import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { listChildren, parentProfile } from "@/lib/parent";
import { difficultyStyle } from "@/lib/student";
import { formatDuration, timeSpentBySubject } from "@/lib/progress";
import { recordSubscription, stripe, subscriptionFor } from "@/lib/billing";
import { ParentNav } from "./ParentNav";
import { ChildProgress } from "./ChildProgress";
import { HowItWorksSteps } from "./HowItWorks";
import { ProfileCard, SidePanel, WelcomeCard } from "@/app/dashboard/StudentHome";
import billingConfig from "@/config/billing.json";

/**
 * Where a parent lands after logging in.
 *
 * A parent's job here is their children, so the page is the Children list: who
 * they are, what year they are in and what is unlocked, with the way to add
 * another right there. Their own details sit behind Profile in the bar above.
 */
const BILLING_NOTICE: Record<string, { tone: string; text: string }> = {
  success: {
    tone: "bg-green-50 text-green-800 border-green-200",
    text: "Thank you - the subscription is active.",
  },
  cancelled: {
    tone: "bg-ground text-ink-soft border-line",
    text: "Checkout was cancelled; nothing was charged.",
  },
  already: {
    tone: "bg-ground text-ink-soft border-line",
    text: "That child already has an active subscription.",
  },
  unavailable: {
    tone: "bg-warm-tint text-warm border-warm/25",
    text: "Payments are not set up yet. Please try again later.",
  },
  error: {
    tone: "bg-red-50 text-red-800 border-red-200",
    text: "Something went wrong with the payment. Please try again.",
  },
};

function formatDay(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; session_id?: string }>;
}) {
  const session = await getSession();
  // The proxy already guards /parent, but a page that reads a parent's
  // children must not depend on that alone.
  if (!session || session.userType !== "PARENT") redirect("/login");

  const { billing, session_id: checkoutId } = await searchParams;

  // Back from Checkout: record the subscription now rather than wait for the
  // webhook, so the child is unlocked the moment the parent lands here.
  if (billing === "success" && checkoutId) {
    try {
      const checkout = await stripe().checkout.sessions.retrieve(checkoutId, {
        expand: ["subscription"],
      });
      const sub = checkout.subscription;
      if (
        checkout.metadata?.parentId === String(session.userId) &&
        sub &&
        typeof sub !== "string"
      ) {
        await recordSubscription(sub);
      }
    } catch (error) {
      // The webhook will still record it; the parent need not see this.
      console.error("Could not confirm checkout:", error);
    }
  }
  const notice = billing ? BILLING_NOTICE[billing] : undefined;

  const profile = await parentProfile(session.userId);
  const parentName = profile ? displayName(profile) : "Parent";
  const children = await listChildren(session.userId);

  // Each child's figures are fetched alongside the others rather than one
  // after another, so a parent with several children does not wait n times.
  const progress = await Promise.all(
    children.map(async (child) => {
      const [times, subscription] = await Promise.all([
        timeSpentBySubject(child.studentId),
        subscriptionFor(child.studentId),
      ]);
      return { studentId: child.studentId, times, subscription };
    })
  );
  const progressById = new Map(progress.map((p) => [p.studentId, p]));

  const weekSeconds = progress.reduce(
    (sum, p) => sum + p.times.reduce((t, row) => t + row.weekSeconds, 0),
    0
  );
  const allTimeSeconds = progress.reduce(
    (sum, p) => sum + p.times.reduce((t, row) => t + row.allTimeSeconds, 0),
    0
  );
  const firstName = profile?.fName?.trim() || parentName;

  return (
    <div className="min-h-screen bg-ground">
      <ParentNav parentName={parentName} active="home" />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)_300px] items-start">
        {/* Left: the parent's own card. */}
        <ProfileCard
          name={parentName}
          subtitle="Parent account"
          userId={profile?.profileName ?? session.profileName}
          stats={[
            { label: "Children", value: String(children.length) },
            { label: "Practice this week", value: formatDuration(weekSeconds) },
            { label: "Practice all time", value: formatDuration(allTimeSeconds) },
          ]}
        />

        {/* Middle: the children. */}
        <section className="space-y-4 min-w-0">
          <WelcomeCard eyebrow="PARENT DASHBOARD" title={`Welcome, ${firstName}!`}>
            {children.length === 0
              ? "Add your first child to get started."
              : `You are looking after ${children.length} ${
                  children.length === 1 ? "child" : "children"
                }. Here is how they are getting on.`}
          </WelcomeCard>

          {notice && (
            <p className={`rounded-lg border px-4 py-3 text-sm ${notice.tone}`}>
              {notice.text}
            </p>
          )}

          <h3 className="pt-1 text-sm font-semibold text-ink-soft">Your children</h3>

          {children.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="font-display text-lg font-semibold text-ink">
                No children on your account yet
              </p>
              <p className="text-ink-soft text-sm mt-1.5 max-w-sm mx-auto">
                Create a profile for your child and they will be able to log in
                and start practising.
              </p>
              <Link href="/parent/children" className="btn-primary inline-block mt-6 px-5 py-2.5">
                Add a child
              </Link>
            </div>
          ) : (
            <>
              {children.map((child) => (
              <div key={child.studentId} className="card px-5 sm:px-6 py-5">
                <div className="flex items-center gap-4 flex-wrap">
                <span className="w-11 h-11 rounded-full bg-brand-tint text-brand grid place-items-center font-display font-semibold shrink-0">
                  {child.name.charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0">
                  <p className="font-display font-semibold text-ink truncate flex items-center gap-2">
                    {child.name}
                    {!child.isActive && (
                      <span className="chip bg-ground text-ink-soft border-line-strong">
                        Inactive
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-faint mt-0.5">
                    {child.profileName}
                    {child.yearName ? ` · ${child.yearName}` : ""}
                  </p>
                </div>

                {/* Subscription, next to the name it pays for. Plain form
                    posts: the routes answer with a redirect to Stripe. */}
                {(() => {
                  // A school pupil is paid for and managed by the school.
                  if (child.schoolName) {
                    return (
                      <span className="chip bg-brand-tint text-brand border-brand/20">
                        {child.schoolName}
                      </span>
                    );
                  }
                  const sub = progressById.get(child.studentId)?.subscription;
                  return sub?.isPaid ? (
                    <form
                      action="/api/parent/billing/portal"
                      method="post"
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="studentId" value={child.studentId} />
                      <span className="chip bg-green-50 text-green-800 border-green-200">
                        Paid to {formatDay(sub.activeUntil!)}
                      </span>
                      <button
                        type="submit"
                        className="btn-quiet px-3 py-1.5 text-xs whitespace-nowrap"
                      >
                        Manage billing
                      </button>
                    </form>
                  ) : !billingConfig.showSubscribeButton ? null : (
                    // Hidden while src/config/billing.json has
                    // showSubscribeButton: false; the checkout route stays.
                    <form
                      action="/api/parent/billing/checkout"
                      method="post"
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="studentId" value={child.studentId} />
                      <span className="chip bg-warm-tint text-warm border-warm/25">
                        {sub?.activeUntil
                          ? `Expired ${formatDay(sub.activeUntil)}`
                          : "Not subscribed"}
                      </span>
                      <button
                        type="submit"
                        className="btn-primary px-3 py-1.5 text-xs whitespace-nowrap"
                      >
                        Subscribe
                      </button>
                    </form>
                  );
                })()}

                <span className="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
                  {child.levels.length === 0 ? (
                    <span className="chip bg-warm-tint text-warm border-warm/25">
                      No levels unlocked
                    </span>
                  ) : (
                    child.levels.map((level) => (
                      <span
                        key={level}
                        className={`chip ${difficultyStyle(level)}`}
                      >
                        {level}
                      </span>
                    ))
                  )}
                  <Link
                    href={
                      child.schoolName
                        ? `/parent/children/${child.studentId}/home-login`
                        : `/parent/children/${child.studentId}`
                    }
                    className="btn-quiet ml-1 px-3 py-1.5 text-xs whitespace-nowrap"
                  >
                    {child.schoolName ? "Home login" : "Edit"}
                  </Link>
                </span>
                </div>

                <ChildProgress
                  studentId={child.studentId}
                  times={progressById.get(child.studentId)?.times ?? []}
                />
              </div>
              ))}

              <Link
                href="/parent/children"
                className="btn-quiet inline-block px-4 py-2.5 text-sm"
              >
                + Add another child
              </Link>
            </>
          )}
        </section>

        {/* Right: shortcuts and how it works. */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <SidePanel title="Quick links">
            <ul className="mt-2 divide-y divide-line">
              <li>
                <Link href="/parent/children" className="block py-2.5 text-sm hover:text-brand transition">
                  <span className="block font-semibold text-ink">Children Profile</span>
                  <span className="block text-xs text-ink-faint">Add and update your children</span>
                </Link>
              </li>
              <li>
                <Link href="/parent/profile" className="block py-2.5 text-sm hover:text-brand transition">
                  <span className="block font-semibold text-ink">My Profile</span>
                  <span className="block text-xs text-ink-faint">Your own details</span>
                </Link>
              </li>
            </ul>
          </SidePanel>
          <SidePanel title="How SIGQS works">
            <HowItWorksSteps />
          </SidePanel>
        </aside>
      </main>
    </div>
  );
}
