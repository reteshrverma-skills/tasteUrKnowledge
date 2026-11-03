import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { ownsChild, parentProfile } from "@/lib/parent";
import { ParentNav } from "../../../ParentNav";
import { HomeLoginForm } from "./HomeLoginForm";

/**
 * A parent setting up home practice for a pupil their school manages: the login
 * ID to use, and the password. Other children are edited on the page above.
 */
export default async function HomeLoginPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await getSession();
  if (!session || session.userType !== "PARENT") redirect("/login");

  const { studentId: raw } = await params;
  const studentId = Number(raw);
  if (!(await ownsChild(session.userId, studentId))) notFound();

  const [pupil, profile] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: studentId },
      select: {
        fName: true,
        lName: true,
        profileName: true,
        profilePassword: true,
        school: { select: { name: true } },
      },
    }),
    parentProfile(session.userId),
  ]);
  if (!pupil?.school) notFound();

  const name = displayName(pupil);

  return (
    <div className="min-h-screen bg-ground">
      <ParentNav parentName={profile ? displayName(profile) : "Parent"} />

      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-5">
        <Link href="/parent" className="text-sm font-medium text-ink-soft hover:text-brand transition">
          ← Back to dashboard
        </Link>

        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">Home login for {name}</h1>
          <p className="text-ink-soft text-sm mt-1">
            {name} can practise at home by logging in on the normal login page. Their school still
            manages their details.
          </p>
        </header>

        <section className="card p-6 sm:p-8 space-y-5">
          <dl className="grid sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-ink-faint">Login ID</dt>
              <dd className="font-semibold text-ink break-all mt-0.5">{pupil.profileName}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-faint">Password</dt>
              <dd className="font-semibold text-ink mt-0.5">
                {pupil.profilePassword ? "Set" : "Not set yet"}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-ink-faint">
            To change the login ID, ask {pupil.school.name}. A pupil can be on one device at a time, so
            logging in at home ends a turn in class, and the reverse.
          </p>
          <HomeLoginForm studentId={studentId} hasPassword={Boolean(pupil.profilePassword)} />
        </section>
      </div>
    </div>
  );
}
