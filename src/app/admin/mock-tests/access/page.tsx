import Link from "next/link";
import { redirect } from "next/navigation";
import { WelcomeCard } from "@/app/dashboard/StudentHome";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { formatLondon, paperWindow } from "@/lib/mock-test";
import { AccessBoard, PaperPicker, type AccessStudent } from "./AccessBoard";

/**
 * Admin-only: who may sit a mock paper. Pick the paper; Grammar School
 * students without access are on the left, those with access on the right,
 * and the admin moves them across one at a time or all at once.
 */
export default async function MockAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ test?: string }>;
}) {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const papers = await prisma.mockTestGs.findMany({
    orderBy: [{ testDate: "desc" }, { id: "desc" }],
    select: { id: true, name: true, stage: true, programmeCode: true, testDate: true, availableDays: true, approvedByAdmin: true },
  });

  const { test } = await searchParams;
  const paper = papers.find((p) => String(p.id) === test) ?? papers[0];

  let students: AccessStudent[] = [];
  if (paper) {
    const rows = await prisma.userProfile.findMany({
      where: { userType: "STUDENT", isActive: true, programmeCode: paper.programmeCode },
      orderBy: [{ fName: "asc" }, { lName: "asc" }, { profileName: "asc" }],
      select: {
        id: true,
        fName: true,
        lName: true,
        profileName: true,
        school: { select: { name: true } },
        studentDetails: { select: { year: { select: { name: true } } } },
        mockAccess: { where: { testId: paper.id }, select: { revokedAt: true } },
        mockAttempts: { where: { testId: paper.id }, select: { id: true }, take: 1 },
      },
    });
    students = rows.map((s) => ({
      id: String(s.id),
      name: displayName(s),
      profileName: s.profileName,
      year: s.studentDetails?.year?.name ?? null,
      school: s.school?.name ?? null,
      granted: s.mockAccess.some((a) => a.revokedAt === null),
      started: s.mockAttempts.length > 0,
    }));
  }

  const window = paper ? paperWindow(paper.testDate, paper.availableDays) : null;

  return (
    <>
      <Link
        href="/admin/mock-tests"
        className="inline-block text-sm font-medium text-ink-soft hover:text-brand transition"
      >
        ← Mock tests
      </Link>
      <WelcomeCard eyebrow="MOCK TESTS" title="Student access">
        Choose a paper, then move Grammar School students to the right to let them sit it. A student
        sees the paper only when it is approved, open, and they have access.
      </WelcomeCard>

      {!paper ? (
        <div className="card p-6 text-sm text-ink-soft">No mock papers yet.</div>
      ) : (
        <>
          <div className="card p-5">
            <label className="block">
              <span className="eyebrow">Mock paper</span>
              <PaperPicker
                value={String(paper.id)}
                papers={papers.map((p) => ({
                  id: String(p.id),
                  label: `${p.name}${p.stage ? ` · ${p.stage}` : ""}${p.approvedByAdmin ? "" : " (not approved)"}`,
                }))}
              />
            </label>
            {window && (
              <p className="mt-2 text-xs text-ink-faint">
                Open {formatLondon(window.opensAt)} to {formatLondon(window.closesAt)} (UK time)
                {paper.approvedByAdmin ? "" : " · not approved yet, so students cannot see it even with access"}
              </p>
            )}
          </div>

          <AccessBoard key={String(paper.id)} testId={String(paper.id)} students={students} />
        </>
      )}
    </>
  );
}
