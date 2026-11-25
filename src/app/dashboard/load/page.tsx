import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSeniorStudent } from "@/lib/student-account";
import { canonicalCode, studentChoices, subjectsFor } from "@/lib/senior-subjects";
import { blobStorageConfigured } from "@/lib/blob-storage";
import { loadSeniorHome } from "../SeniorHome";
import { ProfileCard, WelcomeCard } from "../StudentHome";
import { formatDate } from "../subjects/marks";
import { LoadForm, type LoadSubject } from "./LoadForm";

/**
 * Load (GCSE / A-Level): upload a test paper - for a new test, or for one
 * already on the student's list, replacing its paper. Photos and PDFs are
 * joined into one PDF in the browser before upload.
 */
export default async function LoadPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSeniorStudent(session)) redirect("/dashboard");

  const [{ card, programmeName }, choices, tests] = await Promise.all([
    loadSeniorHome(session),
    studentChoices(session.userId, session.programme),
    prisma.testLoadALevel.findMany({
      where: { studentId: session.userId },
      orderBy: [{ testDate: "desc" }, { uploadDate: "desc" }],
      select: {
        id: true,
        testName: true,
        subject: true,
        testDate: true,
        papers: {
          where: { deletedAt: null },
          take: 1,
          select: { files: { where: { deletedAt: null }, take: 1, select: { pageCount: true } } },
        },
      },
    }),
  ]);

  const subjects: LoadSubject[] = subjectsFor(session.programme)
    .filter((s) => choices.some((c) => c.subjectCode === s.code))
    .map((s) => ({
      code: s.code,
      name: s.name,
      tests: tests
        .filter((t) => canonicalCode(session.programme, t.subject) === s.code)
        .map((t) => ({
          id: String(t.id),
          label: `${t.testName}${t.testDate ? ` · ${formatDate(t.testDate)}` : ""}`,
          pages: t.papers[0]?.files[0]?.pageCount ?? null,
        })),
    }));

  return (
    <div className="min-h-screen bg-ground">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 items-start">
        <ProfileCard {...card} />
        <section className="space-y-4 min-w-0">
          <WelcomeCard eyebrow={`${programmeName.toUpperCase()} PAPERS`} title="Load a paper">
            Upload a test paper as photos or PDFs - they are joined into one PDF. Start a new test,
            or pick one you already have to replace its paper. View or download it later from the
            subject under Progress.
          </WelcomeCard>
          {subjects.length === 0 ? (
            <div className="card p-5 text-sm text-ink-soft">
              You have not chosen any subjects yet.{" "}
              <Link href="/dashboard/profile" className="font-medium text-brand hover:underline">
                Choose them on My Profile
              </Link>
              .
            </div>
          ) : (
            <LoadForm subjects={subjects} storageReady={blobStorageConfigured()} />
          )}
        </section>
      </main>
    </div>
  );
}
