"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { difficultyStyle, scoreStyle } from "@/lib/level-style";

interface Question {
  id: number;
  topic: string;
  subTopic: string;
  typeOfQuestion: string;
  quest: string;
  stemFormat: string;
  stemFigure: string | null;
  optionFormat: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string | null;
  difficultyLevel: string;
}

interface GradedAnswer {
  questionId: number;
  quest: string;
  chosenOption: string | null;
  ansChoice: string;
  ansExplain: string | null;
  typeOfQuestion: string;
  isCorrect: boolean;
}

interface Results {
  score: number;
  totalCount: number;
  percentage: number;
  answers: GradedAnswer[];
}

/**
 * Draws one stored figure.
 *
 * The markup has already been refused at the database and stripped again by
 * the server, so by the time it reaches here it is shape geometry and nothing
 * else. It still goes through dangerouslySetInnerHTML, which is the only way
 * to render inline SVG, so the two passes before this one are what make it
 * safe rather than this call site.
 *
 * The figures use `currentColor`, so they inherit the surrounding ink and
 * follow the theme without any per-figure styling.
 */
function Figure({ markup, className }: { markup: string; className?: string }) {
  return (
    <span
      className={`block [&>svg]:w-full [&>svg]:h-full ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

interface FigureOption {
  label: string;
  figure: string;
}

/** Only the options the question actually offers - E is often absent. */
function optionsFor(question: Question): FigureOption[] {
  const all: Array<{ label: string; figure: string | null }> = [
    { label: "A", figure: question.optionA },
    { label: "B", figure: question.optionB },
    { label: "C", figure: question.optionC },
    { label: "D", figure: question.optionD },
    { label: "E", figure: question.optionE },
  ];

  return all.filter((option): option is FigureOption =>
    Boolean(option.figure)
  );
}

export function NvrQuiz() {
  const params = useSearchParams();
  const subTopic = params.get("subTopic") ?? "";
  const topic = params.get("topic") ?? "";
  const level = params.get("level") ?? "";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState("");
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Results | null>(null);

  /* Timing: monotonic, and paused while the tab is hidden, exactly as the
     other two subjects do it. */
  const startedAtRef = useRef<string | null>(null);
  const questionStartRef = useRef<number | null>(null);
  const elapsedRef = useRef<Record<number, number>>({});
  const questionsRef = useRef<Question[]>([]);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const bankTime = useCallback((questionId: number) => {
    if (questionStartRef.current === null) return;
    elapsedRef.current[questionId] =
      (elapsedRef.current[questionId] ?? 0) +
      (performance.now() - questionStartRef.current);
    questionStartRef.current = null;
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      const id = questionsRef.current[currentIndexRef.current]?.id;
      if (document.hidden) {
        if (id !== undefined) bankTime(id);
      } else if (questionsRef.current.length > 0) {
        questionStartRef.current = performance.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [bankTime]);

  // A URL with no topic needs no request, so that case is derived at render
  // rather than set from an effect.
  const missingParams = !level || (!subTopic && !topic);

  useEffect(() => {
    if (missingParams) return;

    let cancelled = false;

    (async () => {
      try {
        const query = new URLSearchParams({ level });
        if (subTopic) query.set("subTopic", subTopic);
        if (topic) query.set("topic", topic);

        const response = await fetch(`/api/nvr/questions?${query}`);
        const data = await response.json();

        if (cancelled) return;
        if (!response.ok) {
          setFailed(data.error || "Could not load these questions.");
          return;
        }
        if (!data.questions?.length) {
          setFailed("There are no questions here yet.");
          return;
        }

        setQuestions(data.questions);
        setAnswers(
          Object.fromEntries(
            data.questions.map((q: Question) => [q.id, null])
          ) as Record<number, string | null>
        );
        startedAtRef.current = new Date().toISOString();
        questionStartRef.current = performance.now();
      } catch (error) {
        if (!cancelled) setFailed("Could not load these questions.");
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [missingParams, level, subTopic, topic]);

  // What the screen actually shows, once the no-topic case is folded in.
  const showLoading = missingParams ? false : loading;
  const problem = missingParams
    ? "Pick a topic from the Non-Verbal page to start a round."
    : failed;

  const goToIndex = (nextIndex: number) => {
    if (nextIndex === currentIndex) return;
    const leavingId = questions[currentIndex]?.id;
    if (leavingId !== undefined) bankTime(leavingId);
    setCurrentIndex(nextIndex);
    questionStartRef.current = performance.now();
  };

  const choose = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const openId = questions[currentIndex]?.id;
    if (openId !== undefined) bankTime(openId);

    try {
      const response = await fetch("/api/nvr/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startedAt: startedAtRef.current,
          completionReason: "submitted",
          subTopic: subTopic || null,
          topic: topic || null,
          level: level || null,
          answers: questions.map((question) => ({
            questionId: question.id,
            chosenOption: answers[question.id] ?? null,
            timeSpentSeconds: (elapsedRef.current[question.id] ?? 0) / 1000,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to submit answers");
      setResults(await response.json());
      setCurrentIndex(0);
    } catch (error) {
      console.error(error);
      alert("Failed to submit answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const backHref = `/dashboard/subject/non-verbal${
    level ? `?level=${encodeURIComponent(level)}` : ""
  }`;

  /* ------------------------------------------------------------------ */
  if (showLoading) {
    return (
      <Shell backHref={backHref}>
        <p className="text-center text-ink-soft py-16">Loading…</p>
      </Shell>
    );
  }

  if (problem) {
    return (
      <Shell backHref={backHref}>
        <div className="card p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            Nothing to show
          </p>
          <p className="text-ink-soft text-sm mt-1.5">{problem}</p>
          <Link href={backHref} className="btn-primary inline-block mt-6 px-5 py-2.5">
            Back to Non-Verbal
          </Link>
        </div>
      </Shell>
    );
  }

  /* Results ----------------------------------------------------------- */
  if (results) {
    return (
      <Shell backHref={backHref}>
        <div className="card p-6 sm:p-8 mb-5 text-center">
          <p className="eyebrow">Your score</p>
          <p className="font-display text-5xl font-bold text-ink mt-2 tabular">
            {results.score}
            <span className="text-ink-faint">/{results.totalCount}</span>
          </p>
          <span
            className={`chip chip-lg mt-3 ${scoreStyle(results.percentage)}`}
          >
            {results.percentage}%
          </span>
        </div>

        <div className="space-y-3">
          {results.answers.map((answer, idx) => (
            <div
              key={answer.questionId}
              className={`card p-4 border-l-4 ${
                answer.isCorrect ? "border-l-good" : "border-l-poor"
              }`}
            >
              <div className="flex items-start gap-2 mb-1.5">
                <span className="text-xs text-ink-faint tabular mt-0.5">
                  Q{idx + 1}
                </span>
                <p className="text-sm font-medium text-ink">{answer.quest}</p>
              </div>
              <p className="text-xs text-ink-soft">
                You chose{" "}
                <strong className="text-ink">
                  {answer.chosenOption ?? "nothing"}
                </strong>
                {" · "}answer was{" "}
                <strong className="text-ink">{answer.ansChoice}</strong>
              </p>
              {answer.ansExplain && (
                <p className="text-xs text-ink-soft mt-2 leading-relaxed">
                  {answer.ansExplain}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <Link href={backHref} className="btn-quiet flex-1 py-2.5 text-center text-sm">
            Back to Non-Verbal
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary flex-1 py-2.5 text-sm"
          >
            Try another round
          </button>
        </div>
      </Shell>
    );
  }

  /* Quiz -------------------------------------------------------------- */
  const question = questions[Math.min(currentIndex, questions.length - 1)];
  const answeredCount = questions.filter((q) => answers[q.id]).length;

  return (
    <Shell backHref={backHref}>
      <form onSubmit={handleSubmit} className="card p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="text-sm font-medium text-ink tabular">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className={`chip ${difficultyStyle(question.difficultyLevel)}`}>
            {question.typeOfQuestion}
          </span>
        </div>
        <div className="w-full bg-line rounded-full h-1 mb-5">
          <div
            className="bg-brand h-1 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>

        <p className="font-display text-[17px] font-semibold text-ink leading-snug mb-4">
          {question.quest}
        </p>

        {question.stemFigure && (
          <div className="flex justify-center mb-5">
            {/* Sized by the figure: a wide sequence strip spans the row, a
                square figure stays square, and neither sits in empty box. */}
            <span className="card-quiet w-full max-w-xl p-3 text-ink">
              <span
                className="block mx-auto [&>svg]:block [&>svg]:mx-auto [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-56"
                dangerouslySetInnerHTML={{ __html: question.stemFigure }}
              />
            </span>
          </div>
        )}

        {/* Options are figures, so they go in a grid rather than a list */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {optionsFor(question).map((option) => {
            const chosen = answers[question.id] === option.label;
            return (
              <label
                key={option.label}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                  chosen
                    ? "border-brand bg-brand-tint text-brand"
                    : "border-line hover:border-line-strong text-ink-soft hover:bg-ground/60"
                }`}
              >
                <input
                  type="radio"
                  name={String(question.id)}
                  value={option.label}
                  checked={chosen}
                  onChange={() => choose(question.id, option.label)}
                  className="sr-only"
                />
                <Figure
                  markup={option.figure}
                  className="w-full aspect-square"
                />
                <span
                  className={`text-xs font-semibold ${
                    chosen ? "text-brand" : "text-ink-faint"
                  }`}
                >
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={() => goToIndex(Math.max(currentIndex - 1, 0))}
            disabled={currentIndex === 0}
            className="btn-quiet flex-1 py-2 text-sm disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() =>
              goToIndex(Math.min(currentIndex + 1, questions.length - 1))
            }
            disabled={currentIndex === questions.length - 1}
            className="btn-quiet flex-1 py-2 text-sm disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => goToIndex(idx)}
              className={`w-8 h-8 rounded-lg font-semibold text-xs border transition tabular ${
                idx === currentIndex
                  ? "bg-brand text-white border-brand"
                  : answers[q.id]
                  ? "bg-good-tint text-good border-good/30"
                  : "bg-surface text-ink-faint border-line hover:border-line-strong"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-2.5 mt-4"
        >
          {submitting ? "Submitting…" : "Submit answers"}
        </button>
      </form>
    </Shell>
  );
}

function Shell({
  children,
  backHref,
}: {
  children: React.ReactNode;
  backHref: string;
}) {
  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-3.5 flex justify-between items-center gap-4">
          <Link
            href={backHref}
            className="text-sm font-medium text-ink-soft hover:text-brand transition"
          >
            ← Non-Verbal
          </Link>
          <span className="font-display text-lg font-bold text-brand">
            TasteUrKnowledge
          </span>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8">{children}</div>
    </div>
  );
}
