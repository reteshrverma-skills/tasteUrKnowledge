import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { ownsChild } from "@/lib/parent";
import { ParentFrame } from "../../../ParentFrame";
import { WelcomeCard } from "@/app/dashboard/StudentHome";
import { HomeLoginForm } from "./HomeLoginForm";
import { PasscodeForm } from "../../PasscodeForm";

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

  const [pupil] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: studentId },
      select: {
        fName: true,
        lName: true,
        profileName: true,
        profilePassword: true,
        profilePasscode: true,
        school: { select: { name: true } },
      },
    }),
  ]);
  if (!pupil?.school) notFound();

  const name = displayName(pupil);

  return (
    <ParentFrame>
      <WelcomeCard eyebrow="HOME LOGIN" title={`Home login for ${name}`}>
        {name} can practise at home by logging in on the normal login page. Their school still
        manages their details.
      </WelcomeCard>

      <section className="card p-5 sm:p-6 space-y-5">
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

      <section className="card p-5 sm:p-6 space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">Login Pin</h2>
        <PasscodeForm studentId={studentId} hasPasscode={Boolean(pupil.profilePasscode)} />
      </section>
    </ParentFrame>
  );
}
