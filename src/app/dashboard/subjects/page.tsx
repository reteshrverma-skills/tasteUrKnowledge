import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSeniorStudent } from "@/lib/student-account";
import { canonicalCode, studentChoices, subjectsFor } from "@/lib/senior-subjects";
import { scoreStyle } from "@/lib/level-style";
import { loadSeniorHome } from "../SeniorHome";
import { ProfileCard, WelcomeCard } from "../StudentHome";
import { percent } from "./marks";

/**
 * Subjects.
 *
 * GCSE and A-Level only (Grammar School practice subjects are on Home): the subjects chosen on My Profile, each with
 * its exam board and a summary of the tests loaded for it (testLoadALevel);
 * "View details" opens the subject's tests.
 */
export default async function SubjectsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Grammar School practice subjects are on Home now.
  if (!isSeniorStudent(session)) redirect("/dashboard");
  return <SeniorSubjectsPage />;
}

async function SeniorSubjectsPage() {
  const session = await getSession();
  if (!isSeniorStudent(session)) redirect("/login");

  const [{ card, programmeName }, choices, tests] = await Promise.all([
    loadSeniorHome(session),
    studentChoices(session.userId, session.programme),
    prisma.testLoadALevel.findMany({
      where: { studentId: session.userId },
      select: { subject: true, testName: true, testDate: true, awardedMarks: true, totalMarks: true, uploadDate: true },
      orderBy: [{ testDate: "desc" }, { uploadDate: "desc" }],
    }),
  ]);

  const chosen = subjectsFor(session.programme).flatMap((subject) => {
    const choice = choices.find((c) => c.subjectCode === subject.code);
    const board = subject.boards.find((b) => b.code === choice?.boardCode);
    if (!board) return [];
    const own = tests.filter((t) => canonicalCode(session.programme, t.subject) === subject.code);
    const awarded = own.reduce((n, t) => n + t.awardedMarks, 0);
    const total = own.reduce((n, t) => n + t.totalMarks, 0);
    return [{ subject, board, tests: own, latest: own[0], overall: total ? percent(awarded, total) : null }];
  });

  return (
    <div className="min-h-screen bg-ground">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 items-start">
        <ProfileCard {...card} />
        <section className="space-y-4 min-w-0">
          <WelcomeCard eyebrow={`${programmeName.toUpperCase()} SUBJECTS`} title="Your subjects">
            The subjects you chose on My Profile. Open one to see your test papers, marks
            question by question and how you are doing in each topic.
          </WelcomeCard>

          {chosen.length === 0 && (
            <div className="card p-5 text-sm text-ink-soft">
              You have not chosen any subjects yet.{" "}
              <Link href="/dashboard/profile" className="font-medium text-brand hover:underline">
                Choose them on My Profile
              </Link>
              .
            </div>
          )}

          {chosen.map(({ subject, board, tests: own, latest, overall }) => (
            <article key={subject.code} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-ink">{subject.name}</h4>
                <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand">
                  {board.name} · {board.specCode}
                </span>
                {overall !== null && (
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium tabular ${scoreStyle(overall)}`}>
                    Overall {overall}%
                  </span>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-ink-faint text-xs">Tests loaded</dt>
                  <dd className="font-semibold text-ink tabular">{own.length}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-ink-faint text-xs">Latest test</dt>
                  <dd className="text-ink truncate">
                    {latest
                      ? `${latest.testName} · ${latest.awardedMarks}/${latest.totalMarks} (${percent(latest.awardedMarks, latest.totalMarks)}%)`
                      : "None yet"}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/dashboard/subjects/${subject.code}`}
                className="mt-4 inline-block btn-primary px-3.5 py-1.5 text-sm"
              >
                View details
              </Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
