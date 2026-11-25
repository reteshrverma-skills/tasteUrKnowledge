import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSeniorStudent } from "@/lib/student-account";
import { loadSeniorHome } from "../SeniorHome";
import { ProfileCard, SubjectPost, WelcomeCard } from "../StudentHome";

/**
 * Subjects.
 *
 * GCSE and A-Level only (Grammar School practice subjects are on Home): the
 * subjects chosen on My Profile. Test results per subject are on Progress.
 */
export default async function SubjectsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Grammar School practice subjects are on Home.
  if (!isSeniorStudent(session)) redirect("/dashboard");

  const { card, programmeName, subjects, boardByName } = await loadSeniorHome(session);

  return (
    <div className="min-h-screen bg-ground">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 items-start">
        <ProfileCard {...card} />
        <section className="space-y-4 min-w-0">
          <WelcomeCard eyebrow={`${programmeName.toUpperCase()} SUBJECTS`} title="Your subjects">
            The subjects you chose on My Profile. Each will open one by one - with topic-by-topic
            questions, timed papers and feedback on every answer. Your test results are on Progress.
          </WelcomeCard>

          {subjects.length === 0 && (
            <div className="card p-5 text-sm text-ink-soft">
              You have not chosen any subjects yet.{" "}
              <Link href="/dashboard/profile" className="font-medium text-brand hover:underline">
                Choose them on My Profile
              </Link>
              .
            </div>
          )}
          {subjects.map((subject) => (
            <SubjectPost key={subject.name} {...subject} board={boardByName.get(subject.name)} />
          ))}
        </section>
      </main>
    </div>
  );
}
