"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { difficultyStyle } from "@/lib/level-style";
import { LevelIcon } from "@/app/dashboard/subject/LevelIcon";
import { LogoutButton } from "@/components/LogoutButton";

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

// E is offered but optional; A-D stay required.
const OPTIONS = ["A", "B", "C", "D", "E"] as const;
const REQUIRED_OPTIONS = ["A", "B", "C", "D"] as const;

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

/** Every year's comprehensions; the page narrows them by level. */
async function fetchPassages(): Promise<Passage[]> {
  const response = await fetch("/api/admin/english");
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
            {passage.yearName ?? "No year"} ·{" "}
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
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loadingPassages, setLoadingPassages] = useState(true);
  const [error, setError] = useState("");

  // The level whose passages are listed, picked from the chips at the top.
  const [level, setLevel] = useState(LEVELS[0]);

  useEffect(() => {
    let active = true;

    fetchPassages()
      .then((data) => {
        if (active) setPassages(data);
      })
      .catch(() => {
        if (active) setError("Failed to load passages");
      })
      .finally(() => {
        if (active) setLoadingPassages(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshPassages = async () => {
    try {
      setPassages(await fetchPassages());
    } catch {
      setError("Failed to load passages");
    }
  };

  const levelPassages = passages.filter(
    (p) => p.difficultyLevel?.toLowerCase() === level.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/admin"
            className="text-brand hover:text-brand-hover font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-brand">
            English Comprehension
          </h1>
          <LogoutButton />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display font-semibold text-ink">Draft a new passage with Claude</p>
            <p className="text-sm text-ink-soft">
              Your prompt, a level, reference passages and copyright guidance. Drafts are saved unapproved.
            </p>
          </div>
          <Link href="/admin/english/generate" className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap">
            Generate with Claude
          </Link>
        </div>

        {/* Same difficulty selector as the student English page */}
        <div>
          <h2 className="eyebrow mb-2.5">Difficulty level</h2>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => {
              const isActive = l === level;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  aria-pressed={isActive}
                  className={`chip chip-lg border transition inline-flex items-center gap-1.5 ${
                    isActive
                      ? "bg-brand text-white border-brand shadow-sm"
                      : `${difficultyStyle(l)} hover:brightness-[0.97]`
                  }`}
                >
                  <LevelIcon level={l} />
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Existing passages at the selected level, all years */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-brand text-white font-bold">
            {level} passages
          </div>
          {loadingPassages ? (
            <div className="p-6 text-center">Loading...</div>
          ) : levelPassages.length === 0 ? (
            <div className="p-6 text-center text-ink-soft">
              No {level} passages yet.
            </div>
          ) : (
            <div>
              {levelPassages.map((passage) => (
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
