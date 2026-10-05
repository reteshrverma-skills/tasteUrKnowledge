import Link from "next/link";
import { scoreStyle } from "@/lib/level-style";

export const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;

export interface ReviewQuestion {
  id: number;
  quest: string | null;
  /** Already sanitised SVG markup, for Non-Verbal. */
  stemFigure?: string | null;
  /** Text, or sanitised SVG markup when the review is of figures. */
  options: { label: string; content: string }[];
  chosen: string | null;
  right: string | null;
  isRight: boolean;
  explanation?: string | null;
}

export interface ReviewTest {
  testStartTime: Date;
  difficultyLevel: string | null;
  completionReason: string | null;
}

/**
 * Inline SVG from the Non-Verbal bank. The caller passes markup that has been
 * through sanitiseFigure, as the quiz does.
 */
function Figure({ markup, className }: { markup: string; className?: string }) {
  return (
    <span
      className={`block [&>svg]:w-full [&>svg]:h-full ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

/** Drops options the question does not offer - E is often absent. */
export function presentOptions(
  q: Partial<Record<`option${(typeof OPTION_LABELS)[number]}`, string | null>>
) {
  return OPTION_LABELS.map((label) => ({
    label,
    content: q[`option${label}`] ?? "",
  })).filter((o) => o.content.trim());
}

/**
 * One past round, question by question: what was chosen, what was right, and
 * why when the bank says. Shared by every subject's review page.
 */
export function TestReview({
  backHref,
  backLabel,
  title,
  test,
  isTopicTest = false,
  passage,
  figures = false,
  questions,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  test: ReviewTest;
  isTopicTest?: boolean;
  /** The comprehension text, for English and Verbal. */
  passage?: string | null;
  /** Options and stems are SVG figures rather than text. */
  figures?: boolean;
  questions: ReviewQuestion[];
}) {
  const total = questions.length;
  const correct = questions.filter((q) => q.isRight).length;
  const percentage = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-3.5 flex justify-between items-center gap-4">
          <Link
            href={backHref}
            className="text-sm font-medium text-ink-soft hover:text-brand transition"
          >
            ← {backLabel}
          </Link>
          <span className="font-display text-lg font-bold text-brand">
            TasteUrKnowledge
          </span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            <p className="text-ink-soft text-sm mt-1">
              {[
                test.difficultyLevel,
                isTopicTest && "whole-topic test",
                test.testStartTime.toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
                test.completionReason === "timed_out" && "ran out of time",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className={`chip chip-lg ${scoreStyle(percentage)}`}>
              {percentage}%
            </span>
            <p className="text-xs text-ink-faint mt-1 tabular">
              {correct}/{total} correct
            </p>
          </div>
        </header>

        {passage && (
          <details className="card mb-4 overflow-hidden">
            <summary className="px-5 py-3 cursor-pointer select-none font-semibold text-ink hover:bg-ground/60 transition">
              Read the passage
            </summary>
            <div className="px-5 pb-5 pt-1 border-t border-line text-[15px] text-ink leading-[1.75] whitespace-pre-line">
              {passage}
            </div>
          </details>
        )}

        <ol className="space-y-3">
          {questions.map((row, idx) => (
            <li
              key={row.id}
              className={`card p-5 border-l-4 ${
                row.isRight ? "border-l-green-500" : "border-l-red-500"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="font-semibold text-ink">
                  <span className="text-brand">Q{idx + 1}:</span> {row.quest}
                </p>
                <span
                  className={`text-xs font-semibold shrink-0 ${
                    row.isRight ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {row.isRight
                    ? "✓ Correct"
                    : row.chosen
                    ? "✗ Incorrect"
                    : "– Not answered"}
                </span>
              </div>

              {row.stemFigure && (
                <div className="flex justify-center mb-4">
                  <span className="card-quiet w-28 h-28 p-3 text-ink">
                    <Figure markup={row.stemFigure} className="w-full h-full" />
                  </span>
                </div>
              )}

              <ul
                className={
                  figures
                    ? "grid grid-cols-2 sm:grid-cols-4 gap-2.5"
                    : "space-y-1.5"
                }
              >
                {row.options.map((o) => {
                  const isRight = o.label === row.right;
                  const isChosen = o.label === row.chosen;
                  const tone = isRight
                    ? "border-green-500 bg-green-50 text-green-900"
                    : isChosen
                    ? "border-red-400 bg-red-50 text-red-900"
                    : "border-line text-ink-soft";
                  const tag = isRight
                    ? "Correct answer"
                    : isChosen
                    ? "Your answer"
                    : null;

                  return figures ? (
                    <li
                      key={o.label}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${tone}`}
                    >
                      <Figure markup={o.content} className="w-full aspect-square" />
                      <span className="text-xs font-semibold">
                        {o.label}
                        {tag && ` · ${tag}`}
                      </span>
                    </li>
                  ) : (
                    <li
                      key={o.label}
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${tone}`}
                    >
                      <strong>{o.label}:</strong>
                      <span className="flex-1">{o.content}</span>
                      {tag && <span className="text-xs font-semibold">{tag}</span>}
                    </li>
                  );
                })}
              </ul>

              {row.explanation && (
                <p className="text-sm text-ink-soft mt-3 pt-3 border-t border-line">
                  <strong className="text-ink">Why:</strong> {row.explanation}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
