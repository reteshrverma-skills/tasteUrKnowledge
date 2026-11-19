"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SeniorSubject, SubjectChoice } from "@/lib/senior-subjects";

/** Tick each subject studied and pick its awarding organisation. */
export function SubjectsForm({
  subjects,
  initial,
}: {
  subjects: SeniorSubject[];
  initial: SubjectChoice[];
}) {
  const router = useRouter();
  // subjectCode -> boardCode; "" = ticked but no board chosen yet.
  const [chosen, setChosen] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.map((c) => [c.subjectCode, c.boardCode]))
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (next: Record<string, string>) => {
    setChosen(next);
    setSaved(false);
  };

  const toggle = (code: string, on: boolean) => {
    const next = { ...chosen };
    if (on) next[code] = "";
    else delete next[code];
    update(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    const missing = subjects.find((s) => s.code in chosen && !chosen[s.code]);
    if (missing) {
      setError(`Choose an awarding organisation for ${missing.name}`);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/student/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: Object.entries(chosen).map(([subjectCode, boardCode]) => ({ subjectCode, boardCode })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save your subjects");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your subjects");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <ul className="space-y-3">
        {subjects.map((subject) => {
          const on = subject.code in chosen;
          return (
            <li key={subject.code} className={`rounded-lg border px-4 py-3 ${on ? "border-brand" : "border-line"}`}>
              <label className="flex items-center gap-3 font-semibold text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => toggle(subject.code, e.target.checked)}
                  className="w-4 h-4 accent-brand"
                />
                {subject.name}
              </label>
              {on && (
                <fieldset className="mt-3 pl-7">
                  <legend className="text-xs font-semibold text-ink-soft mb-2">Awarding organisation</legend>
                  <div className="flex flex-wrap gap-2">
                    {subject.boards.map((board) => (
                      <label
                        key={board.code}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm cursor-pointer ${
                          chosen[subject.code] === board.code
                            ? "border-brand bg-brand text-white"
                            : "border-line-strong text-ink-soft hover:border-brand"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`board-${subject.code}`}
                          value={board.code}
                          checked={chosen[subject.code] === board.code}
                          onChange={() => update({ ...chosen, [subject.code]: board.code })}
                          className="sr-only"
                        />
                        {board.name}
                        <span className="text-xs opacity-75 tabular">{board.specCode}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-poor">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-good font-semibold">
          ✓ Subjects saved.
        </p>
      )}
      <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5">
        {saving ? "Saving…" : "Save subjects"}
      </button>
    </form>
  );
}
