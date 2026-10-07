"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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

        setResults(await response.json());
        setCurrentIndex(0);
      } catch (error) {
        console.error("Error submitting answers:", error);
        alert("Failed to submit answers. Please try again.");
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [bankTime, subTopic, topic, level]
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (missingParams || loadError || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-lg shadow-lg p-10">
          <p className="text-gray-800 text-lg font-medium">
            {missingParams
              ? "Pick a topic and difficulty first"
              : loadError || "No questions found"}
          </p>
          <Link
            href={backHref}
            className="inline-block mt-6 bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Back to Maths
          </Link>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Results                                                           */
  /* ---------------------------------------------------------------- */
  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link
              href={backHref}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Maths
            </Link>
            <h1 className="text-2xl font-bold text-indigo-600">
              TasteUrKnowledge
            </h1>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Results</h2>
              <p className="text-gray-600 mt-1">
                {roundLabel} · {level}
                {isTopicTest && " · whole-topic test"}
              </p>
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
                  {answer.explanation && (
                    <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-300">
                      <strong>Why:</strong> {answer.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href={backHref}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition text-center"
            >
              Back to Maths
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition"
            >
              New Random Set
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Quiz - one question at a time, no story pane for Maths            */
  /* ---------------------------------------------------------------- */
  const total = questions.length;
  const safeIndex = Math.min(currentIndex, total - 1);
  const currentQuestion = questions[safeIndex];
  const answeredCount = questions.filter((q) => answers[q.id]).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-3">
          <Link
            href={backHref}
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm shrink-0"
          >
            ← Maths
          </Link>
          <p className="text-sm text-gray-600 truncate hidden sm:block">
            <span className="font-semibold text-gray-800">{roundLabel}</span>
            {level && ` · ${level}`}
            {isTopicTest && " · whole topic"}
          </p>
          <h1 className="text-lg font-bold text-indigo-600 shrink-0">
            TasteUrKnowledge
          </h1>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Progress */}
          <div className="px-5 py-3 border-b border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold text-gray-800 text-sm">
                Question {safeIndex + 1} of {total}
              </p>
              <p className="text-xs text-gray-600">
                Answered:{" "}
                <span className="font-bold text-indigo-600">
                  {answeredCount}
                </span>
                /{total}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all"
                style={{ width: `${(answeredCount / total) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Taller frame so the question sits visibly centred; my-auto
                centres it when there is room and collapses when there is not,
                so a long question is never clipped. */}
            <div className="px-5 py-6 min-h-[60vh] flex flex-col">
              <div className="my-auto w-full max-w-2xl mx-auto">
                <h3 className="font-bold text-gray-800 mb-4">
                  <span className="text-indigo-600">Q{safeIndex + 1}:</span>{" "}
                  {currentQuestion.quest}
                </h3>

                <div className="space-y-2">
                  {optionsFor(currentQuestion).map((option) => (
                    <label
                      key={option.label}
                      className={`flex items-start p-2.5 rounded-lg border-2 cursor-pointer transition ${
                        answers[currentQuestion.id] === option.label
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-300 hover:border-indigo-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={String(currentQuestion.id)}
                        value={option.label}
                        checked={answers[currentQuestion.id] === option.label}
                        onChange={() =>
                          handleAnswerChange(currentQuestion.id, option.label)
                        }
                        className="w-4 h-4 mt-0.5 shrink-0"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        <strong>{option.label}:</strong> {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                  disabled={safeIndex === 0}
                  className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((i) => Math.min(i + 1, total - 1))
                  }
                  disabled={safeIndex === total - 1}
                  className="flex-1 bg-indigo-600 text-white py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {questions.map((question, idx) => {
                  const isCurrent = idx === safeIndex;
                  const isAnswered = Boolean(answers[question.id]);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      aria-current={isCurrent ? "true" : undefined}
                      className={`w-8 h-8 rounded font-bold text-xs border-2 transition ${
                        isCurrent
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : isAnswered
                          ? "bg-green-100 text-green-700 border-green-500 hover:border-green-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-indigo-300"
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
                className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition"
              >
                {submitting ? "Submitting..." : "Submit Answers"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function MathsQuizPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <MathsQuiz />
    </Suspense>
  );
}
