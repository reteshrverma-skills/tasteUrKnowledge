"use client";

import { useEffect, useRef, useState } from "react";
import type { CountryStats } from "@/lib/admin-stats";

const num = (value: number) => value.toLocaleString("en-GB");

/** One figure in the pop-up: a number with its label under it. */
function Figure({
  value,
  label,
  unit,
  strong = false,
}: {
  value: number;
  label: string;
  unit?: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className={`font-display text-2xl font-bold tabular ${strong ? "text-brand" : "text-ink"}`}>
        {num(value)}
        {unit && <span className="text-sm font-semibold text-ink-soft ml-1">{unit}</span>}
      </p>
      <p className="text-sm text-ink-soft mt-0.5">{label}</p>
    </div>
  );
}

/** The pop-up with one country's figures. Esc, the backdrop or Close shut it. */
function CountryModal({ country, onClose }: { country: CountryStats; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus starts on Close, so keyboard and screen-reader users land inside.
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // The page behind stays put while the pop-up is open.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-4 py-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-modal-title"
        className="card w-full max-w-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 id="country-modal-title" className="font-display text-2xl font-bold text-ink">
            {country.code && (
              <span className="font-mono text-base font-semibold text-ink-soft mr-2">{country.code}</span>
            )}
            {country.name}
          </h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="btn-quiet px-3 py-1.5 text-sm shrink-0"
          >
            Close
          </button>
        </div>

        <p className="eyebrow mt-6 mb-2.5">Accounts</p>
        <div className="grid grid-cols-2 gap-3">
          <Figure value={country.students} label="Students" />
          <Figure value={country.parents} label="Parents" />
        </div>

        <p className="eyebrow mt-6 mb-2.5">Students who logged in</p>
        <div className="grid grid-cols-3 gap-3">
          <Figure value={country.studentLogins.today} label="Today" strong />
          <Figure value={country.studentLogins.week} label="This week" />
          <Figure value={country.studentLogins.month} label="This month" />
        </div>

        <p className="eyebrow mt-6 mb-2.5">Practice time</p>
        <div className="grid grid-cols-2 gap-3">
          <Figure value={country.practiceMinutes.month} label="This month" unit="min" strong />
          <Figure value={country.practiceMinutes.allTime} label="All time" unit="min" />
        </div>

        <p className="text-xs text-ink-faint mt-4">
          Each student counted once per period. UK time; the week starts on Monday.
        </p>
      </div>
    </div>
  );
}

/**
 * Countries with accounts, from userProfile.countryCode, under the totals on
 * the Product Director's page. Each opens a pop-up with that country's
 * figures; "Not recorded" holds accounts made before country was asked.
 */
export function CountryStatsTable({ rows }: { rows: CountryStats[] }) {
  const [open, setOpen] = useState<CountryStats | null>(null);

  return (
    <section className="card p-6 mt-8" aria-labelledby="country-heading">
      <h3 id="country-heading" className="font-display text-xl font-semibold text-ink">
        By country
      </h3>
      <p className="text-xs text-ink-faint mt-1">Select a country to see its figures.</p>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-faint mt-4">No accounts yet.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r) => (
            <li key={r.code ?? "none"}>
              <button
                type="button"
                onClick={() => setOpen(r)}
                className="w-full flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition hover:border-brand hover:shadow-sm"
              >
                <span className="w-9 font-mono text-xs font-semibold text-ink-soft">{r.code ?? "—"}</span>
                <span className={`flex-1 truncate ${r.code ? "text-ink" : "text-ink-faint italic"}`}>{r.name}</span>
                <span className="text-ink-faint" aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && <CountryModal country={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
