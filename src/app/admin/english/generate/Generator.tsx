"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { difficultyStyle } from "@/lib/level-style";

// The difficulty ladder, in teaching order. Kept here rather than imported
// from lib/student, which pulls the database client into the browser bundle.
const LEVELS = ["Starter", "Explorer", "Navigator", "Challenger", "Master"];
const LETTERS = ["A", "B", "C", "D", "E"] as const;
const MAX_REFERENCES = 3;

interface CompOption {
  id: number;
  title: string;
  level: string | null;
  yearName: string | null;
  approved: boolean;
  questionCount: number;
}

interface DraftQuestion {
  quest: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  ansChoice: (typeof LETTERS)[number];
  typeOfQuestion: string;
}

interface Draft {
  title: string;
  story: string;
  questions: DraftQuestion[];
  basis: { level: string; yearName: string; references: string[] };
}

const inputClass =
  "w-full px-4 py-2 border border-line-strong rounded-lg bg-surface focus:ring-2 focus:ring-brand focus:outline-none";

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function Generator({
  years,
  comps,
  defaultGuidance,
  minQuestions,
  maxQuestions,
}: {
  years: { id: string; name: string }[];
  comps: CompOption[];
  defaultGuidance: string;
  minQuestions: number;
  maxQuestions: number;
}) {
  const [yearId, setYearId] = useState(years[0]?.id ?? "");
  const [level, setLevel] = useState(LEVELS[0]);
  const [count, setCount] = useState(Math.min(30, maxQuestions));
  const [instructions, setInstructions] = useState("");
  const [guidance, setGuidance] = useState(defaultGuidance);
  const [referenceIds, setReferenceIds] = useState<number[]>([]);
  const [allLevels, setAllLevels] = useState(false);
  const [search, setSearch] = useState("");

  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // A visible clock: a full comprehension takes a few minutes to write.
  useEffect(() => {
    if (!generating) return;
    const started = Date.now();
    const timer = window.setInterval(
      () => setElapsed(Math.round((Date.now() - started) / 1000)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [generating]);

  const visibleComps = comps.filter(
    (c) =>
      (allLevels || c.level?.toLowerCase() === level.toLowerCase()) &&
      c.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const toggleReference = (id: number) =>
    setReferenceIds((ids) =>
      ids.includes(id)
        ? ids.filter((x) => x !== id)
        : ids.length >= MAX_REFERENCES
          ? ids
          : [...ids, id]
    );

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setDraft(null);
    setSaved(false);
    setElapsed(0);
    setGenerating(true);
    try {
      const response = await fetch("/api/admin/english/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearId,
          difficultyLevel: level,
          count,
          instructions,
          copyrightGuidance: guidance,
          referenceIds,
        }),
      });
      // The route streams spaces while Claude writes, then the JSON.
      const text = await response.text();
      let data: (Draft & { error?: undefined }) | { error: string };
      try {
        data = JSON.parse(text.trim());
      } catch {
        throw new Error("The response could not be read. Please try again.");
      }
      if (!response.ok || "error" in data && data.error) {
        throw new Error(
          ("error" in data && data.error) || "Generation failed. Please try again."
        );
      }
      setDraft(data as Draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearId,
          title: draft.title,
          story: draft.story,
          difficultyLevel: draft.basis.level,
          questions: draft.questions.map((q) => ({ ...q, topic: "" })),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not save the passage");
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the passage");
    } finally {
      setSaving(false);
    }
  };

  const typeCounts = draft
    ? Object.entries(
        draft.questions.reduce<Record<string, number>>((acc, q) => {
          acc[q.typeOfQuestion] = (acc[q.typeOfQuestion] ?? 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
          <Link href="/admin/english" className="text-brand hover:text-brand-hover font-medium">
            ← English Comprehension
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-brand">Generate with Claude</h1>
          <LogoutButton />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <form onSubmit={generate} className="card p-6 sm:p-8 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="block">
              <span className="eyebrow">Year</span>
              <select value={yearId} onChange={(e) => setYearId(e.target.value)} className={`${inputClass} mt-1.5`} required>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="eyebrow">Difficulty level</span>
              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  setReferenceIds([]);
                }}
                className={`${inputClass} mt-1.5`}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="eyebrow">Questions ({minQuestions}–{maxQuestions})</span>
              <input
                type="number"
                min={minQuestions}
                max={maxQuestions}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className={`${inputClass} mt-1.5`}
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="eyebrow">Prompt</span>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="e.g. An adventure story set on a Scottish island in winter, told by a 10-year-old who finds an injured seal. Include some weather vocabulary."
              className={`${inputClass} mt-1.5`}
            />
            <span className="text-xs text-ink-faint">
              Theme, setting, characters, vocabulary to include - anything to steer the draft.
            </span>
          </label>

          {/* References: existing passages shown to Claude for level and style */}
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="eyebrow">References from the bank</span>
                <p className="text-xs text-ink-faint mt-0.5">
                  Pick up to {MAX_REFERENCES}. Claude reads them for reading level and question
                  style only, and is told not to reuse their text, titles, characters or plots.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={allLevels} onChange={(e) => setAllLevels(e.target.checked)} />
                Show all levels
              </label>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles"
              className={`${inputClass} mt-3`}
            />
            <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-line divide-y divide-line">
              {visibleComps.length === 0 ? (
                <p className="p-4 text-sm text-ink-faint">No passages match.</p>
              ) : (
                visibleComps.map((c) => {
                  const chosen = referenceIds.includes(c.id);
                  const full = !chosen && referenceIds.length >= MAX_REFERENCES;
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm ${full ? "opacity-50" : "cursor-pointer hover:bg-ground"}`}
                    >
                      <input type="checkbox" checked={chosen} disabled={full} onChange={() => toggleReference(c.id)} />
                      <span className="flex-1 min-w-0 truncate text-ink">{c.title}</span>
                      {c.level && <span className={`chip ${difficultyStyle(c.level)}`}>{c.level}</span>}
                      <span className="text-xs text-ink-faint tabular whitespace-nowrap">
                        {c.questionCount} Q{c.approved ? "" : " · unapproved"}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <p className="text-xs text-ink-soft mt-2">
              {referenceIds.length} of {MAX_REFERENCES} chosen. Existing titles at this level are
              always sent so the new title is different.
            </p>
          </div>

          <label className="block">
            <span className="eyebrow">Copyright guidance</span>
            <textarea
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              rows={6}
              maxLength={2000}
              className={`${inputClass} mt-1.5 text-sm`}
            />
            <span className="flex flex-wrap justify-between gap-2 text-xs text-ink-faint">
              <span>Sent with every request. Claude is also always told the passage must be original.</span>
              <button type="button" onClick={() => setGuidance(defaultGuidance)} className="underline hover:text-ink">
                Reset to default
              </button>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={generating || !yearId} className="btn-primary px-6 py-2.5 disabled:opacity-50">
              {generating ? "Writing…" : draft ? "Generate another" : "Generate draft"}
            </button>
            {generating && (
              <span className="text-sm text-ink-soft tabular" role="status">
                Claude is writing the passage and questions - usually 1 to 4 minutes ({elapsed}s).
              </span>
            )}
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
            {error}
          </div>
        )}

        {draft && (
          <section className="card p-6 sm:p-8 space-y-6">
            <header className="space-y-2">
              <p className="eyebrow">Draft · not saved · visible to admins only</p>
              <h2 className="font-display text-2xl font-bold text-ink">{draft.title}</h2>
              <p className="text-sm text-ink-soft">
                {draft.basis.level} · {draft.basis.yearName} · {countWords(draft.story)} words ·{" "}
                {draft.questions.length} questions
                {draft.basis.references.length > 0 && ` · references: ${draft.basis.references.join(", ")}`}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {typeCounts.map(([type, n]) => (
                  <span key={type} className="chip bg-ground text-ink-soft border-line">
                    {type} × {n}
                  </span>
                ))}
              </div>
            </header>

            <div className="rounded-xl bg-ground p-5 text-ink leading-relaxed whitespace-pre-wrap">
              {draft.story}
            </div>

            <ol className="space-y-4">
              {draft.questions.map((q, i) => (
                <li key={i} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-ink">
                      <span className="text-ink-faint tabular mr-2">{i + 1}.</span>
                      {q.quest}
                    </p>
                    <span className="chip bg-brand-tint text-brand border-brand/20 shrink-0">{q.typeOfQuestion}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {LETTERS.filter((l) => q[`option${l}`]?.trim()).map((l) => {
                      const right = q.ansChoice === l;
                      return (
                        <li
                          key={l}
                          className={`rounded-lg px-3 py-1.5 ${right ? "bg-good-tint text-good font-semibold" : "text-ink-soft"}`}
                        >
                          <strong>{l}:</strong> {q[`option${l}`]}
                          {right && " ✓ correct"}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
              {saved ? (
                <p className="text-sm text-good font-semibold">
                  ✓ Saved as an unapproved passage. Students cannot see it until you approve it on the{" "}
                  <Link href="/admin/english" className="underline">English Comprehension</Link> page.
                </p>
              ) : (
                <>
                  <button type="button" onClick={save} disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
                    {saving ? "Saving…" : "Save as unapproved passage"}
                  </button>
                  <button type="button" onClick={() => setDraft(null)} className="btn-quiet px-5 py-2.5">
                    Discard
                  </button>
                  <span className="text-xs text-ink-faint">
                    Read it through first: check every answer and that nothing resembles a published work.
                  </span>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
