import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitiseFigure } from "@/lib/nvr";
import { DIFFICULTY_ORDER } from "@/lib/student";
import {
  MOCK_SETS,
  SUBJECT_LABEL,
  dateKey,
  formatLondon,
  loadPaper,
  paperProblems,
  paperWindow,
} from "@/lib/mock-test";
import { PaperSettingsForm } from "./PaperSettingsForm";
import { ApprovalPanel } from "./ApprovalPanel";

/**
 * Admin-only: one mock paper. Change its dates, break and section times,
 * see what still stops it being approved, approve it, and read every
 * question with its answer.
 */
export default async function MockPaperPage({ params }: { params: Promise<{ testId: string }> }) {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const { testId } = await params;
  if (!/^\d{1,18}$/.test(testId)) notFound();
  const paper = await loadPaper(BigInt(testId));
  if (!paper) notFound();

  const [problems, questions] = await Promise.all([
    paperProblems(paper),
    prisma.mockTestGsQuestion.findMany({
      where: { testId: paper.id },
      orderBy: [{ setNo: "asc" }, { subject: "asc" }, { questionOrder: "asc" }],
    }),
  ]);
  const { opensAt, closesAt } = paperWindow(paper.testDate, paper.availableDays);
  const started = paper._count.attempts > 0;
  const setMinutes = (setNo: number) =>
    paper.sections.filter((s) => s.setNo === setNo).reduce((n, s) => n + s.durationMinutes, 0);

  return (
    <>
        <Link
          href="/admin/mock-tests"
          className="inline-block text-sm font-medium text-ink-soft hover:text-brand transition"
        >
          ← Mock tests
        </Link>

        {/* Built like the dashboard's greeting card, with the approval state beside the name. */}
        <header className="card p-5">
          <p className="text-xs font-semibold tracking-wide text-login-teal">MOCK TEST</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-xl font-semibold text-ink">{paper.name}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${
                paper.approvedByAdmin ? "bg-good-tint text-good" : "bg-warm-tint text-warm"
              }`}
            >
              {paper.approvedByAdmin ? "Approved" : "Not approved"}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-ink-soft">
            Open {formatLondon(opensAt)} to {formatLondon(closesAt)} (UK time) · Set 1 {setMinutes(1)} min · Set 2{" "}
            {setMinutes(2)} min · break {paper.breakMinutes} min · {paper._count.attempts} sittings started
          </p>
        </header>

        <ApprovalPanel
          testId={String(paper.id)}
          approved={paper.approvedByAdmin}
          approvedAt={paper.approvedByAdminDate ? formatLondon(paper.approvedByAdminDate) : null}
          problems={problems}
          started={started}
        />

        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-ink">Settings</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            The paper closes at 23:59:59 UK time on its last day.
            {started && " Students have started it, so the break and section times are locked."}
          </p>
          <div className="mt-4">
            <PaperSettingsForm
              testId={String(paper.id)}
              stages={[...DIFFICULTY_ORDER]}
              locked={started}
              initial={{
                name: paper.name,
                stage: paper.stage ?? "",
                testDate: dateKey(paper.testDate),
                availableDays: paper.availableDays,
                breakMinutes: paper.breakMinutes,
                sections: paper.sections.map((s) => ({
                  id: String(s.id),
                  setNo: s.setNo,
                  subject: SUBJECT_LABEL[s.subject] ?? s.subject,
                  durationMinutes: s.durationMinutes,
                })),
              }}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-ink">Review questions</h2>
          {MOCK_SETS.map((setNo) => {
            const comp = paper.comps.find((c) => c.setNo === setNo);
            const sections = paper.sections.filter((s) => s.setNo === setNo);
            return (
              <div key={setNo} className="card p-5 space-y-3">
                <h3 className="font-semibold text-ink">Set {setNo}</h3>
                {sections.length === 0 && <p className="text-sm text-ink-soft">Not loaded yet.</p>}
                {sections.map((section) => {
                  const qs = questions.filter((q) => q.setNo === setNo && q.subject === section.subject);
                  return (
                    <details key={String(section.id)} className="rounded-lg border border-line">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">
                        {SUBJECT_LABEL[section.subject] ?? section.subject} · {qs.length} questions ·{" "}
                        {section.durationMinutes} min
                      </summary>
                      <div className="border-t border-line px-4 py-3 space-y-4">
                        {section.subject === "ENGLISH" && comp && (
                          <article className="rounded-lg bg-ground p-4 text-sm leading-relaxed text-ink">
                            <p className="font-semibold">{comp.label}</p>
                            {comp.compStory.split("\n\n").map((p, i) => (
                              <p key={i} className="mt-2">
                                {p}
                              </p>
                            ))}
                          </article>
                        )}
                        {qs.map((q) => (
                          <div key={String(q.id)} className="text-sm">
                            <p className="text-ink whitespace-pre-line">
                              <span className="font-semibold">{q.questionOrder}.</span> {q.quest}
                              {q.typeOfQuestion && (
                                <span className="ml-2 rounded-full bg-brand-tint px-2 py-0.5 text-xs text-brand">
                                  {q.typeOfQuestion}
                                </span>
                              )}
                            </p>
                            {q.stemFigure && (
                              <div
                                className="mt-2 overflow-x-auto"
                                dangerouslySetInnerHTML={{ __html: sanitiseFigure(q.stemFigure) }}
                              />
                            )}
                            <ol className="mt-2 flex flex-wrap gap-2">
                              {(["A", "B", "C", "D", "E"] as const).map((l) => {
                                const value = q[`option${l}`];
                                if (!value) return null;
                                const right = q.correctAnswer.trim() === l;
                                return (
                                  <li
                                    key={l}
                                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                                      right ? "border-good bg-good-tint" : "border-line"
                                    } ${q.optionFormat === "text" ? "basis-full" : ""}`}
                                  >
                                    <b>{l}</b>
                                    {q.optionFormat === "text" ? (
                                      <span>{value}</span>
                                    ) : (
                                      <span dangerouslySetInnerHTML={{ __html: sanitiseFigure(value) }} />
                                    )}
                                  </li>
                                );
                              })}
                            </ol>
                            {q.explanation && (
                              <p className="mt-1 text-xs text-ink-soft">
                                Answer {q.correctAnswer}: {q.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            );
          })}
        </section>
    </>
  );
}
