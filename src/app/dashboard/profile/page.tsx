import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSeniorStudent } from "@/lib/student-account";
import { studentChoices, subjectsFor } from "@/lib/senior-subjects";
import { ProfileForm } from "@/app/parent/profile/ProfileForm";
import { loadSeniorHome } from "../SeniorHome";
import { ProfileCard, WelcomeCard } from "../StudentHome";
import { SubjectsForm } from "./SubjectsForm";
import { SecretForm } from "./SecretForm";

/**
 * My Profile for GCSE and A-Level students: their details, subjects and
 * awarding organisations, password and Pin. Grammar School children are
 * managed by their parent, so they are sent home.
 */
export default async function StudentProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSeniorStudent(session)) redirect("/dashboard");

  const [profile, { card, programmeName }, choices] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: session.userId },
      select: {
        fName: true,
        mName: true,
        lName: true,
        profileName: true,
        profilePasscode: true,
        personalDetails: true,
      },
    }),
    loadSeniorHome(session),
    studentChoices(session.userId, session.programme),
  ]);
  if (!profile) redirect("/login");
  const details = profile.personalDetails;

  return (
    <div className="min-h-screen bg-ground">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6 items-start">
        {/* Left: profile card with the subject choices under it. */}
        <div className="space-y-4">
          <ProfileCard {...card} className="" />
          <Section title="My subjects" note={`Pick the ${programmeName} subjects you study and the awarding organisation (exam board) for each.`}>
            <SubjectsForm subjects={subjectsFor(session.programme)} initial={choices} />
          </Section>
        </div>
        <div className="space-y-4 min-w-0">
          <WelcomeCard eyebrow="MY PROFILE" title={card.name}>
            Your user ID is <span className="font-semibold text-ink">{profile.profileName}</span> and
            cannot be changed.
          </WelcomeCard>

          <Section title="My details">
            <ProfileForm
              endpoint="/api/student/profile"
              initial={{
                fName: profile.fName ?? "",
                mName: profile.mName ?? "",
                lName: profile.lName ?? "",
                emailAddress: details?.emailAddress ?? "",
                contactNumber1: details?.contactNumber1 ?? "",
                contactNumber2: details?.contactNumber2 ?? "",
                userAdd1: details?.userAdd1 ?? "",
                userAdd2: details?.userAdd2 ?? "",
                userAdd3: details?.userAdd3 ?? "",
                userCity: details?.userCity ?? "",
                userCounty: details?.userCounty ?? "",
                userZipCode: details?.userZipCode ?? "",
              }}
            />
          </Section>

          <Section title="Password">
            <SecretForm kind="password" />
          </Section>

          <Section title="Login Pin">
            <SecretForm kind="pin" hasPin={Boolean(profile.profilePasscode)} />
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h3 className="font-semibold text-ink">{title}</h3>
      {note && <p className="mt-0.5 text-sm text-ink-soft">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
