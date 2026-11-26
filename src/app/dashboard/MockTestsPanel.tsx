import Link from "next/link";
import { formatLondon, type StudentMockPaper } from "@/lib/mock-test";
import { scoreStyle } from "@/lib/level-style";

/**
 * The mock tests on a Grammar School student's Mock Test page, as tall cards
 * side by side: papers open now or opening soon, and ones already sat.
 * Start / Continue opens the test at /quiz/mock/[id]; a finished paper
 * links to its results there.
 */
export function MockTestsPanel({ papers }: { papers: StudentMockPaper[] }) {
  return (
    <>
      <h2 id="mock-tests" className="font-display text-lg font-semibold text-ink scroll-mt-20">
        Pick a mock test
      </h2>
      {papers.length === 0 ? (
        <div className="card p-5 text-sm text-ink-soft">
          No mock tests are open right now. When a new mock test is ready, it will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => (
            <MockTestCard key={paper.id} paper={paper} />
          ))}
        </div>
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
    <article className="card p-5 flex flex-col gap-4 md:flex-row md:items-center">
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
        <h3 className="font-semibold text-ink">{paper.name}</h3>
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
      <p className="mt-1.5 text-sm text-ink-soft">
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
      </div>
      {paper.progress === "finished" ? (
        <div className="shrink-0 flex flex-wrap gap-2 md:flex-col md:w-44">
          <Link href={`/quiz/mock/${paper.id}`} className="btn-quiet px-3.5 py-2 text-sm text-center">
            See results
          </Link>
          <Link href={`/quiz/mock/${paper.id}/review`} className="btn-quiet px-3.5 py-2 text-sm text-center">
            Review answers
          </Link>
        </div>
      ) : (
        paper.window === "open" && (
          <Link href={`/quiz/mock/${paper.id}`} className="shrink-0 self-start md:self-center md:w-44 btn-primary px-3.5 py-2 text-sm text-center">
            {paper.progress === "not_started" ? "Start mock test" : "Continue mock test"}
          </Link>
        )
      )}
    </article>
  );
}
