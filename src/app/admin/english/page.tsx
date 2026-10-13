"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Year {
  id: string;
  name: string;
  order: number;
}

interface Question {
  id: number;
  topic: string | null;
  quest: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  optionE: string | null;
  ansChoice: string | null;
  typeOfQuestion: string | null;
}

interface Passage {
  id: number;
  label: string | null;
  compStory: string | null;
  yearName: string | null;
  subjectName: string | null;
  difficultyLevel: string | null;
  approvedByAdmin: boolean | null;
  approvedByAdminDate: string | null;
  questions: Question[];
}

interface QuestionDraft {
  quest: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  ansChoice: string;
  topic: string;
  typeOfQuestion: string;
}

// The difficulty ladder, in teaching order. Kept here rather than imported
// from lib/student, which pulls the database client into the browser bundle.
const LEVELS = ["Starter", "Explorer", "Navigator", "Challenger", "Master"];

// How many questions an AI draft may hold - mirrors lib/comp-generator.
const MIN_GENERATED = 25;
const MAX_GENERATED = 50;

// E is offered but optional; A-D stay required.
const OPTIONS = ["A", "B", "C", "D", "E"] as const;
const REQUIRED_OPTIONS = ["A", "B", "C", "D"] as const;

/** A generated comprehension awaiting the admin's save. */
interface GeneratedDraft {
  yearId: string;
  title: string;
  story: string;
  level: string;
  questions: QuestionDraft[];
}

/**
 * One question as a student would meet it, with the right answer marked
 * underneath - the same reading as the test review page.
 */
function PreviewQuestion({
  question,
  position,
}: {
  question: QuestionDraft;
  position: number;
}) {
  const options = OPTIONS.map((letter) => ({
    letter,
    text: question[`option${letter}` as keyof QuestionDraft],
  })).filter((o) => o.text.trim());

  return (
    <li className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="font-semibold text-ink">
          <span className="text-brand">Q{position}:</span> {question.quest}
        </p>
        {question.typeOfQuestion && (
          <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-tint text-brand">
            {question.typeOfQuestion}
          </span>
        )}
      </div>

      <ul className="space-y-1.5">
        {options.map((o) => {
          const isRight = o.letter === question.ansChoice;
          return (
            <li
              key={o.letter}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                isRight
                  ? "border-green-500 bg-green-50 text-green-900"
                  : "border-gray-200 text-ink-soft"
              }`}
            >
              <strong>{o.letter}:</strong>
              <span className="flex-1">{o.text}</span>
              {isRight && (
                <span className="text-xs font-semibold">Correct answer</span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-ink-soft mt-2">
        <strong className="text-ink">Answer:</strong> {question.ansChoice}
      </p>
    </li>
  );
}

function emptyQuestion(): QuestionDraft {
  return {
    quest: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    optionE: "",
    ansChoice: "A",
    topic: "",
    typeOfQuestion: "",
  };
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

async function readError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

async function fetchYears(): Promise<Year[]> {
  const response = await fetch("/api/admin/years");
  if (!response.ok) throw new Error("Failed to load years");
  return response.json();
}

async function fetchPassages(yearId: string): Promise<Passage[]> {
  const response = await fetch(
    `/api/admin/english?yearId=${encodeURIComponent(yearId)}`
  );
  if (!response.ok) throw new Error("Failed to load passages");
  return response.json();
}

const inputClass =
  "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:outline-none";

/** One question's inputs, shared by the new-passage form and the add form. */
function QuestionFields({
  value,
  position,
  onChange,
  onRemove,
}: {
  value: QuestionDraft;
  position: number;
  onChange: (next: QuestionDraft) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-ink-soft">Question {position}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        )}
      </div>

      <textarea
        value={value.quest}
        onChange={(e) => onChange({ ...value, quest: e.target.value })}
        required
        rows={2}
        className={`${inputClass} mb-3`}
        placeholder="e.g., Why did Maya decide to keep the letter?"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {OPTIONS.map((letter) => {
          const key = `option${letter}` as keyof QuestionDraft;
          return (
            <div key={letter}>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                Option {letter}
              </label>
              <input
                type="text"
                value={value[key]}
                onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                required={REQUIRED_OPTIONS.includes(
                  letter as (typeof REQUIRED_OPTIONS)[number]
                )}
                className={inputClass}
                placeholder={letter === "E" ? "Optional" : undefined}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium text-ink-soft mb-1">
          Correct answer
        </label>
        <div className="flex gap-4">
          {OPTIONS.map((letter) => (
            <label key={letter} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={value.ansChoice === letter}
                onChange={() => onChange({ ...value, ansChoice: letter })}
                className="accent-brand"
              />
              {letter}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/** An existing passage: read its story, edit it, and manage its questions. */
function PassageCard({
  passage,
  onRefresh,
  onError,
}: {
  passage: Passage;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(passage.label ?? "");
  const [editStory, setEditStory] = useState(passage.compStory ?? "");
  const [draft, setDraft] = useState<QuestionDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const startEditing = () => {
    setEditTitle(passage.label ?? "");
    setEditStory(passage.compStory ?? "");
    setEditing(true);
    setExpanded(true);
  };

  const saveEdits = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/comps/${passage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, story: editStory }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Failed to save passage"));
      }
      setEditing(false);
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save passage");
    } finally {
      setBusy(false);
    }
  };

  /** Approve shows the passage to students; unapprove hides it again. */
  const setApproved = async (approved: boolean) => {
    if (
      !approved &&
      !confirm(`Hide "${passage.label}" from students until it is approved again?`)
    ) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/comps/${passage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Failed to update approval"));
      }
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update approval");
    } finally {
      setBusy(false);
    }
  };

  const deletePassage = async () => {
    if (
      !confirm(
        `Delete "${passage.label}" and its ${passage.questions.length} question(s)?`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/comps/${passage.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Failed to delete passage"));
      }
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete passage");
    } finally {
      setBusy(false);
    }
  };

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;

    setBusy(true);
    try {
      const response = await fetch(
        `/api/admin/comps/${passage.id}/questions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }
      );
      if (!response.ok) {
        throw new Error(await readError(response, "Failed to add question"));
      }
      setDraft(null);
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add question");
    } finally {
      setBusy(false);
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm("Delete this question?")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/comps/${passage.id}/questions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Failed to delete question"));
      }
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete question");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b last:border-b-0">
      <div className="p-4 flex justify-between items-start gap-4 hover:bg-gray-50">
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="flex-1 text-left"
        >
          <p className="font-bold text-ink">
            {expanded ? "▾" : "▸"} {passage.label}{" "}
            <span
              className={`ml-1 align-middle text-xs font-semibold px-2 py-0.5 rounded-full ${
                passage.approvedByAdmin
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {passage.approvedByAdmin ? "Approved" : "Awaiting approval"}
            </span>
          </p>
          <p className="text-sm text-ink-soft mt-1">
            {passage.difficultyLevel ?? "No level"} ·{" "}
            {passage.questions.length} question
            {passage.questions.length === 1 ? "" : "s"} ·{" "}
            {countWords(passage.compStory ?? "")} words
            {!passage.compStory && (
              <span className="text-red-600 font-medium"> · story missing</span>
            )}
          </p>
        </button>

        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setApproved(!passage.approvedByAdmin)}
            disabled={busy}
            className={`px-3 py-2 rounded disabled:opacity-50 text-sm text-white ${
              passage.approvedByAdmin
                ? "bg-gray-500 hover:bg-gray-600"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {passage.approvedByAdmin ? "Unapprove" : "Approve"}
          </button>
          <button
            type="button"
            onClick={startEditing}
            disabled={busy}
            className="bg-indigo-500 text-white px-3 py-2 rounded hover:bg-indigo-600 disabled:opacity-50 text-sm"
          >
            Edit story
          </button>
          <button
            type="button"
            onClick={deletePassage}
            disabled={busy}
            className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 disabled:opacity-50 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-6 space-y-4 bg-gray-50">
          {editing ? (
            <div className="space-y-3 pt-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={inputClass}
              />
              <textarea
                value={editStory}
                onChange={(e) => setEditStory(e.target.value)}
                rows={10}
                className={inputClass}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEdits}
                  disabled={busy}
                  className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50"
                >
                  {busy ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="bg-gray-200 text-ink-soft px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-bold text-ink mb-2">📖 Story</h4>
              <p className="text-ink-soft whitespace-pre-line leading-relaxed">
                {passage.compStory || "No story added yet."}
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 divide-y">
            {passage.questions.length === 0 ? (
              <p className="p-4 text-ink-soft">No questions yet.</p>
            ) : (
              passage.questions.map((question, index) => (
                <div key={question.id} className="p-4 flex justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-ink">
                      Q{index + 1}. {question.quest}
                    </p>
                    <div className="text-sm text-ink-soft mt-1 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      <p>A: {question.optionA}</p>
                      <p>B: {question.optionB}</p>
                      <p>C: {question.optionC}</p>
                      <p>D: {question.optionD}</p>
                      {question.optionE && <p>E: {question.optionE}</p>}
                    </div>
                    <p className="text-sm font-semibold text-indigo-600 mt-1">
                      Correct: {question.ansChoice}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteQuestion(question.id)}
                    disabled={busy}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex-shrink-0 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          {draft ? (
            <form onSubmit={addQuestion} className="space-y-3">
              <QuestionFields
                value={draft}
                position={passage.questions.length + 1}
                onChange={setDraft}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50"
                >
                  {busy ? "Adding..." : "Add question"}
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="bg-gray-200 text-ink-soft px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setDraft(emptyQuestion())}
              className="text-brand hover:text-brand-hover font-medium"
            >
              + Add a question to this passage
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function EnglishAdminPage() {
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);
  // The year whose passages are currently in state; a mismatch means loading.
  const [loadedYearId, setLoadedYearId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [level, setLevel] = useState(LEVELS[0]);
  // The generated comprehension awaiting save. Read-only: it is saved as
  // generated, at the level it was generated for.
  const [generated, setGenerated] = useState<GeneratedDraft | null>(null);

  // AI draft settings
  const [genCount, setGenCount] = useState(MIN_GENERATED);
  const [genTheme, setGenTheme] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let active = true;

    fetchYears()
      .then((data) => {
        if (!active) return;
        setYears(data);
        setSelectedYearId((current) => current || data[0]?.id || "");
      })
      .catch(() => {
        if (active) setError("Failed to load years");
      })
      .finally(() => {
        if (active) setLoadingYears(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Reload the list whenever the admin switches years.
  useEffect(() => {
    if (!selectedYearId) return;

    let active = true;

    fetchPassages(selectedYearId)
      .then((data) => {
        if (active) setPassages(data);
      })
      .catch(() => {
        if (active) setError("Failed to load passages");
      })
      .finally(() => {
        if (active) setLoadedYearId(selectedYearId);
      });

    return () => {
      active = false;
    };
  }, [selectedYearId]);

  const refreshPassages = async () => {
    if (!selectedYearId) return;
    try {
      setPassages(await fetchPassages(selectedYearId));
    } catch {
      setError("Failed to load passages");
    }
  };

  /**
   * Asks Claude for a passage and questions, then shows them below for
   * review. Nothing is saved until the admin presses Save.
   */
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!selectedYearId) {
      setError("Select a year first");
      return;
    }
    if (
      generated &&
      !window.confirm("Replace the unsaved comprehension below with a new one?")
    ) {
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/admin/english/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearId: selectedYearId,
          difficultyLevel: level,
          count: genCount,
          theme: genTheme,
        }),
      });
      // The route streams keep-alive spaces before the JSON, and reports a
      // failure as { error } in the body even on a 200.
      const data = JSON.parse(await response.text());
      if (!response.ok || data.error) {
        throw new Error(data.error || "Generation failed");
      }

      setGenerated({
        yearId: selectedYearId,
        title: data.title,
        story: data.story,
        level,
        questions: data.questions.map(
          (q: Omit<QuestionDraft, "topic">): QuestionDraft => ({
            ...q,
            // Every existing English question carries "Comp" here.
            topic: "Comp",
          })
        ),
      });
      setNotice(
        `"${data.title}" is ready with ${data.questions.length} questions. Review it below, then save it.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreatePassage = async () => {
    setError("");
    setNotice("");

    if (!generated) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The year it was generated for, even if the picker moved since.
          yearId: generated.yearId,
          title: generated.title,
          story: generated.story,
          difficultyLevel: generated.level,
          questions: generated.questions,
        }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Failed to create passage"));
      }
      const created: Passage = await response.json();
      setNotice(
        `"${created.label}" saved with ${created.questions.length} question(s). Students will not see it until you approve it in the list below.`
      );
      setGenerated(null);
      await refreshPassages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create passage");
    } finally {
      setSaving(false);
    }
  };

  const selectedYear = years.find((year) => year.id === selectedYearId);
  const loadingPassages = Boolean(selectedYearId) && loadedYearId !== selectedYearId;

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between">
          <Link
            href="/admin"
            className="text-brand hover:text-brand-hover font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-brand">
            English Comprehension
          </h1>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {notice && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {notice}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* AI draft: fills the form below for review, saves nothing */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-ink">
            Generate Comprehension
          </h2>
          <p className="text-ink-soft mt-1 mb-6">
            Writes a passage and its questions for the chosen year and level.
            It appears below for you to review - nothing is saved until you
            press Save. The passage list at the bottom follows the year
            chosen here.
          </p>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">
                  Year
                </label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  disabled={loadingYears || years.length === 0}
                  className={inputClass}
                >
                  {loadingYears ? (
                    <option value="">Loading years…</option>
                  ) : years.length === 0 ? (
                    <option value="">No years set up</option>
                  ) : (
                    years.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">
                  Difficulty level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className={inputClass}
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">
                  Number of questions ({MIN_GENERATED}-{MAX_GENERATED})
                </label>
                <input
                  type="number"
                  min={MIN_GENERATED}
                  max={MAX_GENERATED}
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1">
                Theme (optional)
              </label>
              <input
                type="text"
                value={genTheme}
                onChange={(e) => setGenTheme(e.target.value)}
                maxLength={200}
                className={inputClass}
                placeholder="e.g., a lost dog at the seaside, the history of the bicycle"
              />
            </div>

            <button
              type="submit"
              disabled={generating || !selectedYearId}
              className="w-full bg-brand text-white py-2 rounded-lg font-medium hover:bg-brand-hover disabled:opacity-50"
            >
              {generating
                ? "Writing the comprehension… this can take a few minutes"
                : `Generate ${genCount} questions`}
            </button>
          </form>
        </div>

        {/* The generated comprehension, read-only, awaiting save */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-ink">Comprehension preview</h2>

          {!generated ? (
            <p className="text-ink-soft mt-1">
              Generate a comprehension above and it appears here to review.
            </p>
          ) : (
            <div className="mt-4 space-y-6">
              <div>
                <p className="text-sm text-ink-soft">
                  {years.find((y) => y.id === generated.yearId)?.name}{" "}
                  · {generated.level}{" "}
                  · {generated.questions.length} questions ·{" "}
                  {countWords(generated.story)} words
                </p>
                <h3 className="text-xl font-bold text-ink mt-1">
                  {generated.title}
                </h3>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-[15px] text-ink leading-[1.75] whitespace-pre-line">
                {generated.story}
              </div>

              <ol className="space-y-4">
                {generated.questions.map((q, index) => (
                  <PreviewQuestion key={index} question={q} position={index + 1} />
                ))}
              </ol>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Discard this comprehension without saving?")) {
                      setGenerated(null);
                      setNotice("");
                    }
                  }}
                  disabled={saving}
                  className="flex-1 bg-gray-100 text-ink-soft py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleCreatePassage}
                  disabled={saving}
                  className="flex-1 bg-brand text-white py-2 rounded-lg font-medium hover:bg-brand-hover disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save passage and questions"}
                </button>
              </div>
              <p className="text-xs text-ink-faint">
                Saved comprehensions stay hidden from students until you
                approve them in the list below.
              </p>
            </div>
          )}
        </div>

        {/* Existing passages for the selected year */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-brand text-white font-bold">
            {selectedYear ? `${selectedYear.name} passages` : "Passages"}
          </div>
          {loadingPassages ? (
            <div className="p-6 text-center">Loading...</div>
          ) : passages.length === 0 ? (
            <div className="p-6 text-center text-ink-soft">
              No passages for this year yet.
            </div>
          ) : (
            <div>
              {passages.map((passage) => (
                <PassageCard
                  key={passage.id}
                  passage={passage}
                  onRefresh={refreshPassages}
                  onError={setError}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
