"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PupilRow } from "@/lib/school";

/**
 * The teacher's pupils as cards, Year by Year, each with two buttons. Test
 * swaps this device over to that pupil (a full page load, so nothing of the
 * teacher's screen is left in memory); Result opens their progress. "End" and
 * "End all turns" sign pupils out on whichever device they are using.
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
              <ul className="grid grid-cols-[repeat(auto-fill,11rem)] gap-3">
                {inYear.map((p) => (
                  <li
                    key={p.studentId}
                    className="min-h-24 flex flex-col justify-between gap-3 rounded-xl border border-line-strong bg-surface px-3.5 py-3"
                  >
                    <div>
                      {/* Wraps rather than cuts off, so a long name is shown in full. */}
                      <p className="font-medium text-ink leading-snug break-words">{p.name}</p>
                      {p.inSession && (
                        <p className="flex items-center justify-between gap-2 text-xs mt-1">
                          <span className="text-good">Practising now</span>
                          <button
                            type="button"
                            onClick={() => end(p.studentId)}
                            disabled={busy !== null}
                            className="font-medium text-ink-soft hover:text-poor disabled:opacity-50"
                          >
                            End
                          </button>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => open(p)}
                        disabled={busy !== null}
                        className="btn-primary flex-1 py-1.5 text-xs disabled:opacity-50"
                      >
                        {busy === p.studentId ? "Opening…" : "Test"}
                      </button>
                      <Link
                        href={`/teacher/pupils/${p.studentId}`}
                        className="btn-quiet flex-1 py-1.5 text-xs text-center"
                      >
                        Result
                      </Link>
                    </div>
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
