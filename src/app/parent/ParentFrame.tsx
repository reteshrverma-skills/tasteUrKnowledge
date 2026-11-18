import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { listChildren, parentProfile } from "@/lib/parent";
import { ProfileCard } from "@/app/dashboard/StudentHome";
import { ParentNav } from "./ParentNav";

/**
 * The frame of a parent's inner pages (Children Profile, edit a child, home
 * login): the shared top bar, the parent's card on the left as on the
 * dashboard, and a way back to the dashboard above the page.
 */
export async function ParentFrame({
  active,
  children,
}: {
  active: "children" | "profile";
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.userType !== "PARENT") redirect("/login");

  const [profile, kids] = await Promise.all([
    parentProfile(session.userId),
    listChildren(session.userId),
  ]);
  const parentName = profile ? displayName(profile) : "Parent";
  const ownCount = kids.filter((c) => !c.schoolName).length;

  return (
    <div className="min-h-screen bg-ground">
      <ParentNav parentName={parentName} active={active} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] items-start">
        <ProfileCard
          name={parentName}
          subtitle="Parent account"
          userId={profile?.profileName ?? session.profileName}
          stats={[
            { label: "Children", value: String(kids.length) },
            { label: "Your accounts", value: String(ownCount) },
            { label: "School managed", value: String(kids.length - ownCount) },
          ]}
        />

        <section className="space-y-4 min-w-0">
          <Link
            href="/parent"
            className="inline-block text-sm font-medium text-ink-soft hover:text-brand transition"
          >
            ← Back to dashboard
          </Link>
          {children}
        </section>
      </main>
    </div>
  );
}
