"use client";

import { useState } from "react";

/**
 * Clears the cached level and topic lists for Maths, Verbal and Non-Verbal,
 * for use right after loading new questions through SQL.
 */
export function RefreshQuestionBank() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const refresh = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/refresh-question-bank", {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not refresh - please try again");
      }
      setMessage({
        ok: true,
        text: `Refreshed at ${new Date().toLocaleTimeString("en-GB")} - students will see the new lists on their next page load.`,
      });
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : "Could not refresh",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-6 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-ink">
            Refresh question lists
          </h3>
          <p className="text-ink-soft text-sm mt-1.5 max-w-2xl">
            Maths, Verbal and Non-Verbal topic lists are cached and refresh daily at 03:00 UK time.
            After loading new questions, refresh so students see them now.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {busy ? "Refreshing…" : "Refresh now"}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-sm ${message.ok ? "text-good" : "text-poor"}`}
          role="status"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
