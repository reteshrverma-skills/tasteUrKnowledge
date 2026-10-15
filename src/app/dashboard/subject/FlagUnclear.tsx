"use client";

import { useState } from "react";

/**
 * "Answer not clear?" on one answer-sheet question. Lets a student tell us a
 * question or its answer did not make sense, and take it back if they tapped
 * it by mistake.
 */
export function FlagUnclear({
  subject,
  rowId,
  initialFlagged,
}: {
  subject: "nvr" | "vr";
  rowId: number;
  initialFlagged: boolean;
}) {
  const [flagged, setFlagged] = useState(initialFlagged);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (next: boolean) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/review/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, rowId, flagged: next }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not save that - please try again");
      }
      setFlagged(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-line flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {flagged ? (
        <>
          <span className="text-fair font-medium">
            ⚑ Reported as unclear - a teacher will check this question
          </span>
          <button
            type="button"
            onClick={() => save(false)}
            disabled={busy}
            className="text-ink-faint hover:text-ink underline underline-offset-2 disabled:opacity-50"
          >
            Undo
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => save(true)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-ink-soft hover:border-fair/50 hover:text-fair transition disabled:opacity-50"
        >
          ⚑ Answer not clear? Report it
        </button>
      )}
      {error && <span className="text-poor">{error}</span>}
    </div>
  );
}
