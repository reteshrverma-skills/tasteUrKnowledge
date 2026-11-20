"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Approve the paper (only when every check passes) or withdraw approval
 * (only before any student has started it).
 */
export function ApprovalPanel({
  testId,
  approved,
  approvedAt,
  problems,
  started,
}: {
  testId: string;
  approved: boolean;
  approvedAt: string | null;
  problems: string[];
  started: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [serverProblems, setServerProblems] = useState<string[]>([]);
  const ready = problems.length === 0;

  const send = async (approve: boolean) => {
    if (approve && !window.confirm("Approve this paper? Students will see it while it is open.")) return;
    if (!approve && !window.confirm("Withdraw approval? Students will no longer see this paper.")) return;
    setBusy(true);
    setError("");
    setServerProblems([]);
    try {
      const response = await fetch(`/api/admin/mock-tests/${testId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setServerProblems(Array.isArray(data.problems) ? data.problems : []);
        throw new Error(data.error || "Could not update the paper");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the paper");
    } finally {
      setBusy(false);
    }
  };

  const shown = serverProblems.length ? serverProblems : problems;

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-semibold text-ink">Approval</h2>
      {approved ? (
        <p className="mt-1 text-sm text-ink-soft">
          Approved{approvedAt ? ` on ${approvedAt}` : ""}. Students can see it between its opening and closing dates.
        </p>
      ) : ready ? (
        <p className="mt-1 text-sm text-good">All checks passed. Review the questions below, then approve.</p>
      ) : (
        <p className="mt-1 text-sm text-ink-soft">Fix these before the paper can be approved:</p>
      )}

      {!approved && shown.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {shown.map((p) => (
            <li key={p} className="flex gap-2 text-poor">
              <span aria-hidden="true">✕</span>
              {p}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {approved ? (
          <button
            type="button"
            onClick={() => send(false)}
            disabled={busy || started}
            title={started ? "Students have already started this paper" : undefined}
            className="btn-quiet px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? "Saving..." : "Withdraw approval"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => send(true)}
            disabled={busy || !ready}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? "Approving..." : "Approve paper"}
          </button>
        )}
        {approved && started && (
          <span className="text-xs text-ink-soft">Students have started it, so it can no longer be withdrawn.</span>
        )}
        {error && (
          <span className="text-sm text-poor" role="alert">
            {error}
          </span>
        )}
      </div>
    </section>
  );
}
