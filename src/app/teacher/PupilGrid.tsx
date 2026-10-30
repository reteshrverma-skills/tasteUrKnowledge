"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PupilRow } from "@/lib/school";

/**
 * The teacher's pupils as tap targets, Year by Year. Tapping one swaps this
 * device over to that pupil (a full page load, so nothing of the teacher's
 * screen is left in memory). "End" and "End all turns" sign pupils out on
 * whichever device they are using.
 */
export function PupilGrid({
  years,
  pupils,
}: {
  years: { id: string; label: string }[];
  pupils: PupilRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | "all" | null>(null);
  const [error, setError] = useState("");

  const post = async (url: string, body: unknown) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Something went wrong");
    return data;
  };

  const open = async (pupil: PupilRow) => {
    if (pupil.inSession && !window.confirm(`${pupil.name} is practising on another device. Move them to this one?`)) {
      return;
    }
    setError("");
    setBusy(pupil.studentId);
    try {
      const data = await post("/api/teacher/open", { studentId: pupil.studentId });
      window.location.assign(data.redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the pupil");
      setBusy(null);
    }
  };

  const end = async (studentId?: number) => {
    setError("");
    setBusy(studentId ?? "all");
    try {
      await post("/api/teacher/end-turns", studentId === undefined ? {} : { studentId });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not end the turn");
    } finally {
      setBusy(null);
    }
  };

  const anyInSession = pupils.some((p) => p.inSession);

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Pupils</h2>
        {anyInSession && (
          <button
            type="button"
            onClick={() => end()}
            disabled={busy !== null}
            className="btn-quiet px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy === "all" ? "Ending…" : "End all turns"}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-poor" role="alert">{error}</p>}

      {years.map((year) => {
        const inYear = pupils.filter((p) => p.yearId === year.id);
        return (
          <div key={year.id}>
            <h3 className="font-semibold text-ink mb-3">{year.label}</h3>
            {inYear.length === 0 ? (
              <p className="text-sm text-ink-faint">No pupils in this year yet.</p>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {inYear.map((p) => (
                  <li key={p.studentId} className="relative">
                    <button
                      type="button"
                      onClick={() => open(p)}
                      disabled={busy !== null}
                      className="w-full text-left rounded-xl border border-line-strong bg-surface px-4 py-3 hover:border-brand hover:shadow-sm transition disabled:opacity-50"
                    >
                      <span className="block font-medium text-ink">{p.name}</span>
                      <span className={`block text-xs mt-0.5 ${p.inSession ? "text-good" : "text-ink-faint"}`}>
                        {busy === p.studentId ? "Opening…" : p.inSession ? "Practising now" : "Tap to start"}
                      </span>
                    </button>
                    {p.inSession && (
                      <button
                        type="button"
                        onClick={() => end(p.studentId)}
                        disabled={busy !== null}
                        className="absolute top-2 right-2 text-xs font-medium text-ink-soft hover:text-poor disabled:opacity-50"
                      >
                        End
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
