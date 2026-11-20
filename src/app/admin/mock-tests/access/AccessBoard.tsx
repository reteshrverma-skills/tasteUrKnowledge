"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface AccessStudent {
  id: string;
  name: string;
  profileName: string;
  year: string | null;
  school: string | null;
  /** Holds access to the paper now. */
  granted: boolean;
  /** Has started the paper, so access can no longer be taken away. */
  started: boolean;
}

/** The paper drop-down: choosing one reloads the page for that paper. */
export function PaperPicker({
  value,
  papers,
}: {
  value: string;
  papers: { id: string; label: string }[];
}) {
  const router = useRouter();
  return (
    <select
      value={value}
      onChange={(e) => router.push(`/admin/mock-tests/access?test=${e.target.value}`)}
      className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink"
    >
      {papers.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
        </option>
      ))}
    </select>
  );
}

function matches(student: AccessStudent, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return [student.name, student.profileName, student.year, student.school].some((v) =>
    v?.toLowerCase().includes(q)
  );
}

/**
 * Two lists: students without access on the left, with access on the right.
 * Each row has an arrow to move it across; "Add all" / "Remove all" move
 * every student the search currently shows. Changes save straight away.
 */
export function AccessBoard({ testId, students }: { testId: string; students: AccessStudent[] }) {
  const [rows, setRows] = useState(students);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [leftQuery, setLeftQuery] = useState("");
  const [rightQuery, setRightQuery] = useState("");

  const left = useMemo(() => rows.filter((s) => !s.granted && matches(s, leftQuery)), [rows, leftQuery]);
  const right = useMemo(() => rows.filter((s) => s.granted && matches(s, rightQuery)), [rows, rightQuery]);
  const grantedCount = rows.filter((s) => s.granted).length;

  const save = async (add: string[], remove: string[]) => {
    if (add.length === 0 && remove.length === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/mock-tests/${testId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add, remove }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save - please try again");

      const added = new Set<string>(data.added ?? []);
      const removed = new Set<string>(data.removed ?? []);
      setRows((current) =>
        current.map((s) =>
          added.has(s.id) ? { ...s, granted: true } : removed.has(s.id) ? { ...s, granted: false } : s
        )
      );
      const kept = (data.kept ?? []).length;
      const parts = [
        added.size && `${added.size} given access`,
        removed.size && `${removed.size} removed`,
        kept && `${kept} kept - they have already started the paper`,
      ].filter(Boolean);
      setMessage({ ok: kept === 0, text: parts.join(" · ") || "Nothing changed" });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setBusy(false);
    }
  };

  const removableRight = right.filter((s) => !s.started);

  return (
    <div className="space-y-3">
      {message && (
        <p
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.ok ? "bg-green-50 text-green-800 border-green-200" : "bg-warm-tint text-warm border-warm/25"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 items-start">
        <Column
          title="Grammar School students"
          count={rows.length - grantedCount}
          query={leftQuery}
          onQuery={setLeftQuery}
          bulkLabel="Add all →"
          bulkDisabled={busy || left.length === 0}
          onBulk={() => save(left.map((s) => s.id), [])}
          empty={leftQuery ? "No student matches." : "Every student has access."}
          students={left}
          renderAction={(s) => (
            <button
              type="button"
              disabled={busy}
              onClick={() => save([s.id], [])}
              aria-label={`Give ${s.name} access`}
              className="btn-quiet px-2.5 py-1 text-sm disabled:opacity-50"
            >
              →
            </button>
          )}
        />

        <Column
          title="Has access"
          count={grantedCount}
          query={rightQuery}
          onQuery={setRightQuery}
          bulkLabel="← Remove all"
          bulkDisabled={busy || removableRight.length === 0}
          onBulk={() => save([], removableRight.map((s) => s.id))}
          empty={rightQuery ? "No student matches." : "No one has access yet."}
          students={right}
          renderAction={(s) =>
            s.started ? (
              <span className="chip bg-ground text-ink-soft border-line-strong" title="Already started - access stays">
                Started
              </span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => save([], [s.id])}
                aria-label={`Remove ${s.name}'s access`}
                className="btn-quiet px-2.5 py-1 text-sm disabled:opacity-50"
              >
                ←
              </button>
            )
          }
          actionFirst
        />
      </div>
    </div>
  );
}

function Column({
  title,
  count,
  query,
  onQuery,
  bulkLabel,
  bulkDisabled,
  onBulk,
  empty,
  students,
  renderAction,
  actionFirst = false,
}: {
  title: string;
  count: number;
  query: string;
  onQuery: (q: string) => void;
  bulkLabel: string;
  bulkDisabled: boolean;
  onBulk: () => void;
  empty: string;
  students: AccessStudent[];
  renderAction: (s: AccessStudent) => React.ReactNode;
  /** Put the arrow on the left (the right-hand list moves students left). */
  actionFirst?: boolean;
}) {
  return (
    <section className="card overflow-hidden min-w-0">
      <header className="px-4 pt-4 pb-3 border-b border-line space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-ink">
            {title} <span className="text-ink-faint font-normal tabular">({count})</span>
          </h3>
          <button
            type="button"
            onClick={onBulk}
            disabled={bulkDisabled}
            className="btn-primary px-3 py-1.5 text-xs whitespace-nowrap disabled:opacity-50"
          >
            {bulkLabel}
          </button>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search name, user id, year or school"
          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink"
        />
      </header>

      {students.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-faint">{empty}</p>
      ) : (
        <ul className="divide-y divide-line max-h-[28rem] overflow-y-auto">
          {students.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
              {actionFirst && renderAction(s)}
              <span className="w-8 h-8 rounded-full bg-brand-tint text-brand grid place-items-center font-display text-sm font-semibold shrink-0">
                {s.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink truncate">{s.name}</span>
                <span className="block text-xs text-ink-faint truncate">
                  @{s.profileName}
                  {s.year ? ` · ${s.year}` : ""}
                  {s.school ? ` · ${s.school}` : ""}
                </span>
              </span>
              {!actionFirst && renderAction(s)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
