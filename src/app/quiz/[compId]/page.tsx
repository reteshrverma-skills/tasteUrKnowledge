"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { difficultyStyle } from "@/lib/level-style";

interface Question {
  id: number;
  quest: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  optionE: string | null;
  /** The comprehension skill being tested, e.g. "Retrieval". */
  typeOfQuestion: string | null;
}

interface Comp {
  id: number;
  label: string | null;
  compStory: string | null;
  yearName: string | null;
  subjectName: string | null;
  difficultyLevel: string | null;
  questions: Question[];
}

interface GradedAnswer {
  questionId: number;
  quest: string | null;
  chosenOption: string | null;
  ansChoice: string | null;
  isCorrect: boolean;
}

interface Results {
  /** testTrackerEnglishMain.id, or null if the round could not be recorded. */
  testId: number | null;
  score: number;
  totalCount: number;
  percentage: number;
  answers: GradedAnswer[];
}

/** Only the options the question actually offers - E is often absent. */
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

export default function QuizPage() {
  const params = useParams();
  const compId = Array.isArray(params.compId)
    ? params.compId[0]
    : (params.compId as string);

  const [comp, setComp] = useState<Comp | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  /* ---------------------------------------------------------------- */
  /* Timing.                                                           */
  /*                                                                   */
  /* English is read-then-answer, so the reading is measured on its    */
  /* own: a child who reads carefully then answers quickly and one who */
  /* skims then labours can reach the same score for opposite reasons. */
  /*                                                                   */
  /* The story and the first question share the screen, so the         */
  /* boundary between the two has to be an action: reading runs from   */
  /* the page appearing until the first touch of the question pane,    */
  /* and per-question timing starts at that same instant. Nothing is   */
  /* counted twice, and the trade-off is that deciding on Q1 before    */
  /* clicking anything is banked as reading.                           */
  /*                                                                   */
  /* performance.now() is used throughout because it is monotonic - a  */
  /* clock change mid-quiz cannot produce a negative duration.         */
  /* ---------------------------------------------------------------- */
  const startedAtRef = useRef<string | null>(null);
  const readAccumRef = useRef(0);
  const readStartRef = useRef<number | null>(null);
  const readingDoneRef = useRef(false);
  const questionStartRef = useRef<number | null>(null);
  const elapsedRef = useRef<Record<number, number>>({});
  const currentIndexRef = useRef(0);
  const questionsRef = useRef<Question[]>([]);

  // Kept in an effect rather than written during render, so the render stays
  // free of side effects.
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    questionsRef.current = comp?.questions ?? [];
  }, [comp]);

  const bankReading = useCallback(() => {
    if (readStartRef.current === null) return;
    readAccumRef.current += performance.now() - readStartRef.current;
    readStartRef.current = null;
  }, []);

  const bankTime = useCallback((questionId: number) => {
    if (questionStartRef.current === null) return;
    const delta = performance.now() - questionStartRef.current;
    elapsedRef.current[questionId] =
      (elapsedRef.current[questionId] ?? 0) + delta;
    questionStartRef.current = null;
  }, []);

  /** First touch of the question pane: reading ends, answering begins. */
  const beginAnswering = useCallback(() => {
    if (!readingDoneRef.current) {
      bankReading();
      readingDoneRef.current = true;
    }
    if (questionStartRef.current === null) {
      questionStartRef.current = performance.now();
    }
  }, [bankReading]);

  // A quiz left in a background tab is not being worked on, so both clocks
  // stop while it is hidden.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        const id = questionsRef.current[currentIndexRef.current]?.id;
        if (id !== undefined) bankTime(id);
        bankReading();
      } else if (!readingDoneRef.current) {
        readStartRef.current = performance.now();
      } else {
        questionStartRef.current = performance.now();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [bankReading, bankTime]);

  useEffect(() => {
    const fetchComp = async () => {
      try {
        const response = await fetch(`/api/comps/${compId}`);
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch comprehension (${response.status}): ${
              errorBody.error || response.statusText
            }`
          );
        }
        const data: Comp = await response.json();
        setComp(data);

        const initialAnswers: Record<number, null> = {};
        data.questions.forEach((q) => {
          initialAnswers[q.id] = null;
        });
        setAnswers(initialAnswers);

        // The story is on screen from here, so reading starts now.
        startedAtRef.current = new Date().toISOString();
        readStartRef.current = performance.now();
      } catch (error) {
        console.error("Error fetching comprehension:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComp();
  }, [compId]);

  const handleAnswerChange = (questionId: number, option: string) => {
    beginAnswering();
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Bank whatever is on the clock right now, so the question being looked
      // at when Submit is pressed is not recorded as zero. A quiz submitted
      // without ever touching the question pane is all reading.
      const openQuestionId =
        questionsRef.current[currentIndexRef.current]?.id;
      if (openQuestionId !== undefined) bankTime(openQuestionId);
      bankReading();

      const answersArray = Object.entries(answers).map(
        ([questionId, chosenOption]) => ({
          questionId: Number(questionId),
          chosenOption,
          timeSpentSeconds:
            (elapsedRef.current[Number(questionId)] ?? 0) / 1000,
        })
      );

      const response = await fetch(`/api/comps/${compId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answersArray,
          startedAt: startedAtRef.current,
          passageReadSeconds: readAccumRef.current / 1000,
          completionReason: "submitted",
        }),
      });

      if (!response.ok) throw new Error("Failed to submit answers");

      const data: Results = await response.json();
      setResults(data);
      setShowResults(true);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert("Failed to submit answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!comp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Comprehension not found</p>
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-700 font-medium mt-4 inline-block"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalQuestions = comp.questions.length;
  const safeIndex = Math.min(currentIndex, Math.max(totalQuestions - 1, 0));
  const currentQuestion = comp.questions[safeIndex];
  const answeredCount = comp.questions.filter((q) => answers[q.id]).length;

  /**
   * Moving between questions closes the clock on the one being left and opens
   * it on the one arrived at, so a question revisited three times accumulates
   * all three visits.
   */
  const goToIndex = (nextIndex: number) => {
    if (nextIndex === safeIndex) return;
    const leavingId = comp.questions[safeIndex]?.id;
    if (leavingId !== undefined) bankTime(leavingId);
    beginAnswering();
    setCurrentIndex(nextIndex);
  };

  /* ------------------------------------------------------------------ */
  /* Results: an ordinary scrolling page                                 */
  /* ------------------------------------------------------------------ */
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-indigo-600">
              TasteUrKnowledge
            </h1>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Quiz Results</h2>
              <div className="mt-6 p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <p className="text-white text-lg">Your Score</p>
                <p className="text-5xl font-bold text-white">
                  {results.score}/{results.totalCount}
                </p>
                <p className="text-white text-xl mt-2">{results.percentage}%</p>
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Answer Review:
              </h3>
              {results.answers.map((answer, idx) => (
                <div
                  key={answer.questionId}
                  className={`p-4 rounded-lg border-2 ${
                    answer.isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                >
                  <p className="font-bold text-gray-800 mb-2">
                    Q{idx + 1}: {answer.quest}
                  </p>
                  <p
                    className={`text-sm mb-2 ${
                      answer.isCorrect ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {answer.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Your Answer:</strong>{" "}
                    {answer.chosenOption || "Not answered"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Correct Answer:</strong> {answer.ansChoice}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition text-center"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Quiz: story and question side by side, each scrolling on its own so  */
  /* the whole thing fits one screen on desktop.                          */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-ground">
      {/* Navigation */}
      <nav className="bg-surface border-b border-line shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex justify-between items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-ink-soft hover:text-brand transition shrink-0"
          >
            ← Dashboard
          </Link>
          <p className="text-sm text-ink-soft truncate hidden sm:block">
            <span className="font-medium text-ink">{comp.label}</span>
            {comp.difficultyLevel && ` · ${comp.difficultyLevel}`}
          </p>
          <span className="font-display text-base font-bold text-brand shrink-0">
            TasteUrKnowledge
          </span>
        </div>
      </nav>

      {/* Two panes */}
      <div className="flex-1 lg:min-h-0 w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-3 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3 lg:gap-4">
        {/* Story - scrolls within its own pane */}
        <section className="card flex flex-col lg:min-h-0 overflow-hidden">
          <header className="px-5 py-3 border-b border-line shrink-0 flex items-center justify-between gap-2">
            <h2 className="font-display font-semibold text-ink truncate">
              {comp.label}
            </h2>
            {comp.difficultyLevel && (
              <span
                className={`chip shrink-0 ${difficultyStyle(
                  comp.difficultyLevel
                )}`}
              >
                {comp.difficultyLevel}
              </span>
            )}
          </header>
          {/* Reading measure: the passage is the one place in the app with
              real prose, so it gets generous line height and a wider size. */}
          <div className="overflow-y-auto px-5 sm:px-7 py-5 max-h-[42vh] lg:max-h-none lg:flex-1 text-[15px] text-ink leading-[1.75] whitespace-pre-line">
            {comp.compStory || "No story for this comprehension."}
          </div>
        </section>

        {/* Question - header and footer pinned, body scrolls */}
        <section className="card flex flex-col lg:min-h-0 overflow-hidden">
          {/* Progress */}
          <header className="px-5 py-3 border-b border-line shrink-0">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-ink tabular">
                Question {safeIndex + 1} of {totalQuestions}
              </p>
              <p className="text-xs text-ink-faint tabular">
                <span className="font-semibold text-brand">
                  {answeredCount}
                </span>
                {" / "}
                {totalQuestions} answered
              </p>
            </div>
            <div className="w-full bg-line rounded-full h-1">
              <div
                className="bg-brand h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    totalQuestions ? (answeredCount / totalQuestions) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </header>

          <form
            onSubmit={handleSubmit}
            className="flex-1 lg:min-h-0 flex flex-col"
          >
            {/* The question itself scrolls if the options are long */}
            <div className="overflow-y-auto px-5 py-4 lg:flex-1 lg:min-h-0 flex flex-col">
              {currentQuestion && (
                <div className="w-full my-auto">
                  {currentQuestion.typeOfQuestion && (
                    <span className="chip bg-brand-tint text-brand border-brand/20 mb-3">
                      {currentQuestion.typeOfQuestion}
                    </span>
                  )}

                  <h3 className="font-display text-[17px] font-semibold text-ink mb-4 leading-snug">
                    {currentQuestion.quest}
                  </h3>

                  <div className="space-y-2">
                    {optionsFor(currentQuestion).map((option) => {
                      const chosen =
                        answers[currentQuestion.id] === option.label;
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
                              handleAnswerChange(
                                currentQuestion.id,
                                option.label
                              )
                            }
                            className="sr-only"
                          />
                          {/* The letter doubles as the radio, so the whole row
                              is the target rather than a 16px circle. */}
                          <span
                            aria-hidden="true"
                            className={`w-6 h-6 shrink-0 rounded-md grid place-items-center text-xs font-semibold transition ${
                              chosen
                                ? "bg-brand text-white"
                                : "bg-ground text-ink-soft"
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
              )}
            </div>

            {/* Controls stay put so they are always reachable */}
            <footer className="px-5 py-3.5 border-t border-line shrink-0 space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goToIndex(Math.max(safeIndex - 1, 0))}
                  disabled={safeIndex === 0}
                  className="btn-quiet flex-1 py-2 text-sm disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    goToIndex(Math.min(safeIndex + 1, totalQuestions - 1))
                  }
                  disabled={safeIndex === totalQuestions - 1}
                  className="btn-quiet flex-1 py-2 text-sm disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>

              {/* Jump to any question. Answered ones are filled, so the gaps
                  are what stands out. */}
              <div className="flex flex-wrap gap-1.5">
                {comp.questions.map((question, idx) => {
                  const isCurrent = idx === safeIndex;
                  const isAnswered = Boolean(answers[question.id]);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => goToIndex(idx)}
                      aria-current={isCurrent ? "true" : undefined}
                      title={`Question ${idx + 1}${
                        isAnswered ? " (answered)" : ""
                      }`}
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
