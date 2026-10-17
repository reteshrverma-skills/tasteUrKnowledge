import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { difficultyStyle } from "@/lib/level-style";
import { nvrQuestionsForTopic, sanitiseFigure } from "@/lib/nvr";
import { presentOptions } from "@/app/dashboard/subject/TestReview";
import { FigureScale, OptionFigure, StemFigure } from "@/components/NvrFigures";
import { LogoutButton } from "@/components/LogoutButton";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Every question in one Non-Verbal topic at one level, laid out like the
 * student's review page with the right answer marked. Each card carries its
 * gsNvrQuestions id so a row can be found in the database.
 */
export default async function AdminNvrTopicPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; topic?: string }>;
}) {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const { level, topic } = await searchParams;
  if (!level || !topic) notFound();

  const questions = await nvrQuestionsForTopic(topic, level);
  const backHref = `/admin/nvr?level=${encodeURIComponent(level)}`;

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href={backHref}
            className="text-brand hover:text-brand-hover font-medium"
          >
            ← Non-Verbal
          </Link>
          <span className="font-display text-lg font-bold text-brand inline-flex items-center gap-2">
            <BrandLogo height={56} />
            Admin
          </span>
          <LogoutButton />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-ink">{topic}</h1>
          <p className="text-ink-soft text-sm mt-1 flex items-center gap-2">
            <span className={`chip ${difficultyStyle(level)}`}>{level}</span>
            {questions.length} question{questions.length === 1 ? "" : "s"}
          </p>
        </header>

        {questions.length === 0 ? (
          <div className="card p-12 text-center text-ink-soft">
            No questions in this topic at {level}.
          </div>
        ) : (
          <ol className="space-y-3">
            {questions.map((q, idx) => {
              // Figures become live markup, so they are stripped here exactly
              // as the quiz and review pages strip them.
              const stem = sanitiseFigure(q.stemFigure);
              const options = presentOptions({
                optionA: sanitiseFigure(q.optionA),
                optionB: sanitiseFigure(q.optionB),
                optionC: sanitiseFigure(q.optionC),
                optionD: sanitiseFigure(q.optionD),
                optionE: sanitiseFigure(q.optionE),
              });

              return (
                <li key={q.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="font-semibold text-ink">
                      <span className="text-brand">Q{idx + 1}:</span> {q.quest}
                    </p>
                    <span className="chip shrink-0 bg-ground text-ink border-line-strong tabular">
                      ID {q.id}
                    </span>
                  </div>
                  <p className="text-xs text-ink-faint mb-3">
                    {[q.subTopic, q.typeOfQuestion].filter(Boolean).join(" · ")}
                  </p>

                  <FigureScale>
                    {stem && <StemFigure markup={stem} />}

                    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {options.map((o) => {
                        const isRight = o.label === q.ansChoice;
                        return (
                          <li
                            key={o.label}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                              isRight
                                ? "border-green-500 bg-green-50 text-green-900"
                                : "border-line text-ink-soft"
                            }`}
                          >
                            <OptionFigure markup={o.content} />
                            <span className="text-xs font-semibold">
                              {o.label}
                              {isRight && " · Correct answer"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </FigureScale>

                  {q.ansExplain && (
                    <p className="text-sm text-ink-soft mt-3 pt-3 border-t border-line">
                      <strong className="text-ink">Why:</strong> {q.ansExplain}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
