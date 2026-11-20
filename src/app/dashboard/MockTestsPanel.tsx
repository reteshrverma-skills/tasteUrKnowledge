import Link from "next/link";
import { formatLondon, type StudentMockPaper } from "@/lib/mock-test";
import { scoreStyle } from "@/lib/level-style";

/**
 * The mock tests on a Grammar School student's home page: papers open now or
 * opening soon, and ones the student has already sat.
 * Start / Continue opens the test at /quiz/mock/[id]; a finished paper
 * links to its results there.
 */
export function MockTestsPanel({ papers }: { papers: StudentMockPaper[] }) {
  return (
    <>
      <h3 id="mock-tests" className="pt-1 text-sm font-semibold text-ink-soft scroll-mt-20">
        Mock tests
      </h3>
      {papers.length === 0 ? (
        <div className="card p-5 text-sm text-ink-soft">
          No mock tests are open right now. When a new mock test is ready, it will appear here.
        </div>
      ) : (
        papers.map((paper) => <MockTestCard key={paper.id} paper={paper} />)
      )}
    </>
  );
}

const PROGRESS: Record<StudentMockPaper["progress"], string> = {
  not_started: "Not started",
  set1_in_progress: "Set 1 in progress",
  set1_done: "Set 1 done",
  set2_in_progress: "Set 2 in progress",
  finished: "Finished",
};

function MockTestCard({ paper }: { paper: StudentMockPaper }) {
  const pct = paper.result ? Math.round((paper.result.marks / paper.result.total) * 100) : null;
  return (
    <article className="card p-4 sm:p-5 flex gap-4">
      <span
        className="w-12 h-12 shrink-0 rounded-xl grid place-items-center bg-challenger-tint text-challenger"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold text-ink">{paper.name}</h4>
          {paper.stage && (
            <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand">{paper.stage}</span>
          )}
          {pct !== null ? (
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium tabular ${scoreStyle(pct)}`}>
              {paper.result!.marks}/{paper.result!.total} · {pct}%
            </span>
          ) : (
            <span className="rounded-full bg-ground px-2 py-0.5 text-xs font-medium text-ink-soft">
              {PROGRESS[paper.progress]}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          {paper.questionCount} questions in 2 sets · Set 1 {paper.setMinutes[0]} min, {paper.breakMinutes} min break, Set 2{" "}
          {paper.setMinutes[1]} min. Each section is timed and you can sit it once.
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          {paper.window === "upcoming"
            ? `Opens ${formatLondon(paper.opensAt)}`
            : paper.window === "open"
              ? `Open until ${formatLondon(paper.closesAt)}`
              : `Closed ${formatLondon(paper.closesAt)}`}
        </p>
        {paper.progress === "finished" ? (
          <Link href={`/quiz/mock/${paper.id}`} className="mt-3 inline-block btn-quiet px-3.5 py-1.5 text-sm">
            See results
          </Link>
        ) : (
          paper.window === "open" && (
            <Link href={`/quiz/mock/${paper.id}`} className="mt-3 inline-block btn-primary px-3.5 py-1.5 text-sm">
              {paper.progress === "not_started" ? "Start mock test" : "Continue mock test"}
            </Link>
          )
        )}
      </div>
    </article>
  );
}
