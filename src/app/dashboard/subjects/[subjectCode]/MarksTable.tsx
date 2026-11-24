"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface MarkRow {
  id: string;
  question: string;
  topic: string | null;
  subtopic: string | null;
  awardedMarks: number;
  totalMarks: number;
}

/**
 * One test's question-by-question marks. "Update marks" turns the Marks
 * column into inputs; nothing is saved until Save is pressed, and the test's
 * total moves with the changes.
 */
export function MarksTable({ testId, rows }: { testId: string; rows: MarkRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const valueOf = (r: MarkRow) => draft[r.id] ?? String(r.awardedMarks);
  const invalid = (r: MarkRow) => {
    const v = valueOf(r);
    return !/^\d+$/.test(v) || Number(v) > r.totalMarks;
  };
  const changed = rows.filter((r) => !invalid(r) && Number(valueOf(r)) !== r.awardedMarks);
  const anyInvalid = rows.some(invalid);

  const start = () => {
    setDraft({});
    setMessage(null);
    setEditing(true);
  };
  const cancel = () => {
    setDraft({});
    setEditing(false);
  };

  const save = async () => {
    if (!changed.length || anyInvalid || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/student/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: changed.map((r) => ({ id: r.id, awardedMarks: Number(valueOf(r)) })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save the marks");
      setEditing(false);
      setDraft({});
      setMessage({ ok: true, text: `Saved ${changed.length} ${changed.length === 1 ? "mark" : "marks"}.` });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Could not save the marks" });
    } finally {
      setSaving(false);
    }
  };

  const colour = (awarded: number, total: number) =>
    awarded === total ? "text-good font-medium" : awarded === 0 ? "text-poor font-medium" : "text-ink";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-2 mb-2 text-sm">
        {message && (
          <span className={`mr-auto text-xs ${message.ok ? "text-good" : "text-poor"}`} role="status">
            {message.text}
          </span>
        )}
        {editing ? (
          <>
            <span className="text-xs text-ink-soft">
              {anyInvalid ? "Fix the marks in red" : changed.length ? `${changed.length} changed` : "No changes yet"}
            </span>
            <button type="button" onClick={cancel} disabled={saving} className="btn-quiet px-3 py-1 text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || anyInvalid || !changed.length}
              className="btn-primary px-3 py-1 text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save marks"}
            </button>
          </>
        ) : (
          <button type="button" onClick={start} className="btn-quiet px-3 py-1 text-sm">
            ✎ Update marks
          </button>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-faint">
            <th className="py-1.5 pr-3 font-medium">Question</th>
            <th className="py-1.5 pr-3 font-medium">Topic</th>
            <th className="py-1.5 pr-3 font-medium">Subtopic</th>
            <th className="py-1.5 font-medium text-right">Marks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const bad = editing && invalid(r);
            const edited = editing && !bad && Number(valueOf(r)) !== r.awardedMarks;
            return (
              <tr key={r.id} className={`border-t border-line ${edited ? "bg-brand-tint" : ""}`}>
                <td className="py-1.5 pr-3 text-ink tabular whitespace-nowrap">{r.question}</td>
                <td className="py-1.5 pr-3 text-ink-soft">{r.topic ?? "-"}</td>
                <td className="py-1.5 pr-3 text-ink-soft">{r.subtopic ?? "-"}</td>
                <td className="py-1.5 text-right tabular whitespace-nowrap">
                  {editing ? (
                    <span className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={r.totalMarks}
                        step={1}
                        value={valueOf(r)}
                        onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                        aria-label={`Marks for question ${r.question}, out of ${r.totalMarks}`}
                        aria-invalid={bad}
                        className={`field !w-16 px-2 py-0.5 text-right text-sm ${bad ? "!border-poor text-poor" : ""}`}
                      />
                      <span className="text-ink-soft">/{r.totalMarks}</span>
                    </span>
                  ) : (
                    <span className={colour(r.awardedMarks, r.totalMarks)}>
                      {r.awardedMarks}/{r.totalMarks}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
