"use client";

import { useState } from "react";
import type { PracticeTarget, ProgressSubject } from "@/lib/progress";

/**
 * "Practise this": puts the topic on the child's dashboard as a focus, with a
 * button there that starts a round on just that. Pressing Remove takes it off
 * again.
 */
export function PractiseButton({
  studentId,
  subject,
  label,
  practice,
  initialFocusId,
}: {
  studentId: number;
  subject: ProgressSubject;
  label: string;
  practice: PracticeTarget;
  initialFocusId: number | null;
}) {
  const [focusId, setFocusId] = useState(initialFocusId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const call = async (input: RequestInfo, init: RequestInit) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(input, init);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save that");
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const set = async () => {
    const data = await call("/api/parent/focus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, subject, label, ...practice }),
    });
    if (data?.id) setFocusId(data.id);
  };

  const remove = async () => {
    if (focusId === null) return;
    const data = await call(`/api/parent/focus/${focusId}`, { method: "PATCH" });
    if (data) setFocusId(null);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {focusId === null ? (
        <button
          type="button"
          onClick={set}
          disabled={busy}
          className="btn-primary px-3 py-1.5 text-xs whitespace-nowrap disabled:opacity-50"
        >
          Practise this
        </button>
      ) : (
        <span className="flex items-center gap-2 text-xs whitespace-nowrap">
          <span className="text-good font-semibold">✓ On their dashboard</span>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="text-ink-faint hover:text-ink underline underline-offset-2 disabled:opacity-50"
          >
            Remove
          </button>
        </span>
      )}
      {error && <span className="text-xs text-poor">{error}</span>}
    </div>
  );
}
