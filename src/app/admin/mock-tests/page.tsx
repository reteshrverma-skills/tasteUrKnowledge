import Link from "next/link";
import { redirect } from "next/navigation";
import { WelcomeCard } from "@/app/dashboard/StudentHome";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatLondon, paperState, paperWindow } from "@/lib/mock-test";

/**
 * Admin-only: every Grammar School mock paper, with its dates and whether it
 * is approved. Open one to change its settings, review it and approve it.
 */
export default async function MockTestsPage() {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const papers = await prisma.mockTestGs.findMany({
    orderBy: [{ testDate: "desc" }, { id: "desc" }],
    include: {
      sections: { select: { setNo: true } },
      _count: { select: { attempts: true, finalResults: true } },
    },
  });

  return (
    <>
        <Link href="/admin" className="inline-block text-sm font-medium text-ink-soft hover:text-brand transition">
          ← Back to dashboard
        </Link>
        <WelcomeCard eyebrow="CONTENT" title="Mock tests">
          Grammar School mock papers. Students only see a paper once it is approved, and only
          between its opening and closing dates.
        </WelcomeCard>

        <Link
          href="/admin/mock-tests/access"
          className="card group flex items-center gap-4 px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <span className="min-w-0">
            <span className="block font-semibold text-ink group-hover:text-brand transition">Student access</span>
            <span className="block text-sm text-ink-soft">
              Choose which Grammar School students can sit each paper
            </span>
          </span>
          <span aria-hidden="true" className="ml-auto text-brand font-semibold">→</span>
        </Link>

        {papers.length === 0 ? (
          <div className="card p-6 text-sm text-ink-soft">
            No mock papers yet. Load one with its SQL script (for example
            prisma/sql/051_mock_test_1_set_1_data.sql) and it will appear here.
          </div>
        ) : (
          <ul className="space-y-3">
            {papers.map((paper) => {
              const { opensAt, closesAt } = paperWindow(paper.testDate, paper.availableDays);
              const sets = new Set(paper.sections.map((s) => s.setNo)).size;
              const state = paperState(paper.approvedByAdmin, opensAt, closesAt);
              return (
                <li key={String(paper.id)}>
                  <Link
                    href={`/admin/mock-tests/${paper.id}`}
                    className="card p-5 flex flex-wrap items-center gap-x-4 gap-y-2 hover:shadow-lg transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-ink">{paper.name}</h2>
                        {paper.stage && (
                          <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand">
                            {paper.stage}
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${state.cls}`}>{state.text}</span>
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">
                        {formatLondon(opensAt)} – {formatLondon(closesAt)} · {sets} of 2 sets loaded ·{" "}
                        {paper._count.finalResults} finished
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-brand">Open →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
    </>
  );
}
