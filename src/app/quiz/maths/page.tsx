"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { scoreStyle } from "@/lib/level-style";

interface Question {
  id: number;
  topic: string | null;
  subTopic: string | null;
  quest: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  optionE: string | null;
  difficultyLevel: string | null;
}

interface GradedAnswer {
  questionId: number;
  quest: string | null;
  subTopic: string | null;
  chosenOption: string | null;
  ansChoice: string | null;
  explanation: string | null;
  isCorrect: boolean;
}

interface Results {
  score: number;
  totalCount: number;
  percentage: number;
  answers: GradedAnswer[];
}

/** Only the options the question actually offers. */
function optionsFor(question: Question) {
  return (
    [
      { label: "A", text: question.optionA },
      { label: "B", text: question.optionB },
      { label: "C", text: question.optionC },
      { label: "D", text: question.optionD },
      { label: "E", text: question.optionE },
    ] as const
  ).filter((option) => option.text?.trim());
}

function MathsQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subTopic = searchParams.get("subTopic") ?? "";
  const topic = searchParams.get("topic") ?? "";
  const level = searchParams.get("level") ?? "";

  // A whole-topic test has no subtopic; the heading names the topic instead.
  const isTopicTest = !subTopic && Boolean(topic);
  const roundLabel = subTopic || topic;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Refs so submit always sends the latest state without being re-created.
  const answersRef = useRef(answers);
  const questionsRef = useRef(questions);
  const currentIndexRef = useRef(currentIndex);
  const submittingRef = useRef(false);

  // Per-question dwell time. performance.now() is monotonic, so an OS clock
  // adjustment mid-round cannot produce a negative or absurd delta.
  const elapsedRef = useRef<Record<number, number>>({});
  const questionStartRef = useRef<number | null>(null);
  const startedAtRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const scope = [
          subTopic && `subTopic=${encodeURIComponent(subTopic)}`,
          topic && `topic=${encodeURIComponent(topic)}`,
        ]
          .filter(Boolean)
          .join("&");
        const response = await fetch(
          `/api/maths/questions?${scope}&level=${encodeURIComponent(level)}`
        );
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load questions");
        }
        const data = await response.json();
        setQuestions(data.questions);

        const initial: Record<number, null> = {};
        data.questions.forEach((q: Question) => {
          initial[q.id] = null;
        });
        setAnswers(initial);
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Failed to load questions"
        );
      } finally {
        setLoading(false);
      }
    };

    if ((subTopic || topic) && level) {
      fetchQuestions();
    }
  }, [subTopic, topic, level]);

  // Missing params are a render-time fact, not something to set in an effect.
  const missingParams = (!subTopic && !topic) || !level;

  const handleAnswerChange = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  // Keep the ref in step with state so a timed-out submit sends the latest
  // answers. Writing to a ref during render is not allowed.
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  /** Banks the time spent on a question and stops its clock. */
  const bankTime = useCallback((questionId: number) => {
    if (questionStartRef.current === null) return;
    const delta = performance.now() - questionStartRef.current;
    elapsedRef.current[questionId] = (elapsedRef.current[questionId] ?? 0) + delta;
    questionStartRef.current = null;
  }, []);

  // Start the clock on the question being shown, and bank it on the way out.
  useEffect(() => {
    if (questions.length === 0 || results) return;
    const id = questions[Math.min(currentIndex, questions.length - 1)]?.id;
    if (id === undefined) return;

    questionStartRef.current = performance.now();
    if (startedAtRef.current === null) {
      startedAtRef.current = new Date().toISOString();
    }
    return () => bankTime(id);
  }, [currentIndex, questions, results, bankTime]);

  // Tab away, minimise or lock the phone and the clock stops. Without this a
  // student who wanders off records the whole break against one question.
  useEffect(() => {
    if (questions.length === 0 || results) return;
    const onVisibility = () => {
      const id = questions[Math.min(currentIndex, questions.length - 1)]?.id;
      if (id === undefined) return;
      if (document.hidden) bankTime(id);
      else questionStartRef.current = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [currentIndex, questions, results, bankTime]);

  /** Marks the round, guarding against a double-click submitting it twice. */
  const submitRound = useCallback(
    async () => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);

      // Bank whatever is on the clock right now, so the question being looked
      // at when Submit is pressed is not recorded as zero.
      if (questionStartRef.current !== null) {
        const id = questionsRef.current[
          Math.min(currentIndexRef.current, questionsRef.current.length - 1)
        ]?.id;
        if (id !== undefined) bankTime(id);
      }

      try {
        const response = await fetch("/api/maths/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startedAt: startedAtRef.current,
            completionReason: "submitted",
            subTopic: subTopic || null,
            topic: topic || null,
            level: level || null,
            answers: Object.entries(answersRef.current).map(
              ([questionId, chosenOption]) => ({
                questionId: Number(questionId),
                chosenOption,
                timeSpentSeconds:
                  (elapsedRef.current[Number(questionId)] ?? 0) / 1000,
              })
            ),
          }),
        });

        if (!response.ok) throw new Error("Failed to submit answers");

        const data = await response.json();
        // Open the same page the score chips do, so a result always looks
        // the same. The inline results below stay as the fallback for a
        // round that could not be saved.
        if (data.testId) {
          router.replace(`/dashboard/subject/maths/review/${data.testId}`);
          return;
        }
        setResults(data);
        setCurrentIndex(0);
      } catch (error) {
        console.error("Error submitting answers:", error);
        alert("Failed to submit answers. Please try again.");
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [bankTime, router, subTopic, topic, level]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitRound();
  };

  const backHref = `/dashboard/subject/maths${
    level ? `?level=${encodeURIComponent(level)}` : ""
  }`;

  if (loading && !missingParams) {
    return (
      <div className="min-h-screen bg-ground grid place-items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-line border-t-brand"></div>
          <p className="mt-4 text-sm text-ink-soft">Loading questions…</p>
        </div>
      </div>
    );
  }

  if (missingParams || loadError || questions.length === 0) {
    return (
      <div className="min-h-screen bg-ground grid place-items-center px-4">
        <div className="card p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            {missingParams
              ? "Pick a topic and difficulty first"
              : loadError || "No questions found"}
          </p>
          <Link href={backHref} className="btn-primary inline-block mt-6 px-5 py-2.5">
            Back to Maths
          </Link>
        </div>
      </div>
    );
  }

  const nav = (
    <nav className="bg-surface border-b border-line shrink-0">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex justify-between items-center gap-3">
        <Link
          href={backHref}
          className="text-sm font-medium text-ink-soft hover:text-brand transition shrink-0"
        >
          ← Maths
        </Link>
        <p className="text-sm text-ink-soft truncate hidden sm:block">
          <span className="font-medium text-ink">{roundLabel}</span>
          {level && ` · ${level}`}
          {isTopicTest && " · whole topic"}
        </p>
        <span className="font-display text-base font-bold text-brand shrink-0">
          TasteUrKnowledge
        </span>
      </div>
    </nav>
  );

  /* ---------------------------------------------------------------- */
  /* Results - only shown when the round could not be saved; a saved   */
  /* round opens its review page instead.                              */
  /* ---------------------------------------------------------------- */
  if (results) {
    return (
      <div className="min-h-screen bg-ground">
        {nav}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-3">
          <div className="card p-6 text-center">
            <p className="eyebrow">Your score</p>
            <p className="font-display text-4xl font-bold text-ink mt-1 tabular">
              {results.score}/{results.totalCount}
            </p>
            <span className={`chip chip-lg mt-2 ${scoreStyle(results.percentage)}`}>
              {results.percentage}%
            </span>
          </div>

          {results.answers.map((answer, idx) => (
            <div
              key={answer.questionId}
              className={`card p-5 border-l-4 ${
                answer.isCorrect ? "border-l-green-500" : "border-l-red-500"
              }`}
            >
              <p className="font-semibold text-ink mb-2">
                <span className="text-brand">Q{idx + 1}:</span> {answer.quest}
              </p>
              <p className="text-sm text-ink-soft">
                Your answer: <strong>{answer.chosenOption || "Not answered"}</strong>
                {" · "}Correct answer: <strong>{answer.ansChoice}</strong>
              </p>
              {answer.explanation && (
                <p className="text-sm text-ink-soft mt-3 pt-3 border-t border-line">
                  <strong className="text-ink">Why:</strong> {answer.explanation}
                </p>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-5">
            <Link href={backHref} className="btn-quiet flex-1 py-2.5 text-center text-sm">
              Back to Maths
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary flex-1 py-2.5 text-sm"
            >
              New round
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Quiz - one question at a time, styled like the comprehension quiz */
  /* ---------------------------------------------------------------- */
  const total = questions.length;
  const safeIndex = Math.min(currentIndex, total - 1);
  const currentQuestion = questions[safeIndex];
  const answeredCount = questions.filter((q) => answers[q.id]).length;

  return (
    <div className="min-h-screen bg-ground flex flex-col">
      {nav}

      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <section className="card overflow-hidden">
          {/* Progress */}
          <header className="px-5 py-3 border-b border-line">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-ink tabular">
                Question {safeIndex + 1} of {total}
              </p>
              <p className="text-xs text-ink-faint tabular">
                <span className="font-semibold text-brand">{answeredCount}</span>
                {" / "}
                {total} answered
              </p>
            </div>
            <div className="w-full bg-line rounded-full h-1">
              <div
                className="bg-brand h-1 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / total) * 100}%` }}
              />
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            {/* Taller frame so the question sits visibly centred; my-auto
                centres it when there is room and collapses when there is not,
                so a long question is never clipped. */}
            <div className="px-5 py-6 min-h-[55vh] flex flex-col">
              <div className="my-auto w-full">
                <h3 className="font-display text-[17px] font-semibold text-ink mb-4 leading-snug">
                  {currentQuestion.quest}
                </h3>

                <div className="space-y-2">
                  {optionsFor(currentQuestion).map((option) => {
                    const chosen = answers[currentQuestion.id] === option.label;
                    return (
                      <label
                        key={option.label}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                          chosen
                            ? "border-brand bg-brand-tint"
                            : "border-line hover:border-line-strong hover:bg-ground/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name={String(currentQuestion.id)}
                          value={option.label}
                          checked={chosen}
                          onChange={() =>
                            handleAnswerChange(currentQuestion.id, option.label)
                          }
                          className="sr-only"
                        />
                        {/* The letter doubles as the radio, so the whole row
                            is the target rather than a 16px circle. */}
                        <span
                          aria-hidden="true"
                          className={`w-6 h-6 shrink-0 rounded-md grid place-items-center text-xs font-semibold transition ${
                            chosen ? "bg-brand text-white" : "bg-ground text-ink-soft"
                          }`}
                        >
                          {option.label}
                        </span>
                        <span
                          className={`text-sm leading-relaxed ${
                            chosen ? "text-ink font-medium" : "text-ink-soft"
                          }`}
                        >
                          {option.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Controls */}
            <footer className="px-5 py-3.5 border-t border-line space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                  disabled={safeIndex === 0}
                  className="btn-quiet flex-1 py-2 text-sm disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.min(i + 1, total - 1))}
                  disabled={safeIndex === total - 1}
                  className="btn-quiet flex-1 py-2 text-sm disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>

              {/* Jump to any question. Answered ones are filled, so the gaps
                  are what stands out. */}
              <div className="flex flex-wrap justify-center gap-1.5">
                {questions.map((question, idx) => {
                  const isCurrent = idx === safeIndex;
                  const isAnswered = Boolean(answers[question.id]);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      aria-current={isCurrent ? "true" : undefined}
                      title={`Question ${idx + 1}${isAnswered ? " (answered)" : ""}`}
                      className={`w-8 h-8 rounded-lg font-semibold text-xs border transition tabular ${
                        isCurrent
                          ? "bg-brand text-white border-brand"
                          : isAnswered
                          ? "bg-good-tint text-good border-good/30"
                          : "bg-surface text-ink-faint border-line hover:border-line-strong"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-2.5"
              >
                {submitting ? "Submitting…" : "Submit answers"}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>
  );
}

export default function MathsQuizPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ground grid place-items-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-line border-t-brand"></div>
        </div>
      }
    >
      <MathsQuiz />
    </Suspense>
  );
}
