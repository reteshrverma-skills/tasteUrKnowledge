"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "full" | "keep-tests";

const OPTIONS: { mode: Mode; title: string; detail: string }[] = [
  {
    mode: "full",
    title: "Delete completely",
    detail:
      "Removes the profile and all of its test history in every subject. This cannot be undone.",
  },
  {
    mode: "keep-tests",
    title: "Delete profile, keep test data",
    detail:
      "The child is removed from your account and can no longer log in, and their name and details are wiped. Their past test results are kept.",
  },
];

/**
 * The parent's way to remove a child. Two steps: pick how, then type the
 * child's login id - the same check the server makes - so one stray click
 * cannot delete anything.
 */
export function DeleteChild({
  studentId,
  profileName,
}: {
  studentId: number;
  profileName: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const chosen = OPTIONS.find((o) => o.mode === mode);
  const confirmed = confirm.trim().toLowerCase() === profileName.toLowerCase();

  const handleDelete = async () => {
    if (!mode || !confirmed) return;
    setError("");
    setDeleting(true);

    try {
      const response = await fetch(`/api/parent/children/${studentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, confirm: confirm.trim() }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Could not delete the profile");
      }
      router.push("/parent/children");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the profile");
      setDeleting(false);
    }
  };

  return (
    <div className="card p-5 sm:p-6 border border-poor/25">
      <h3 className="text-xl font-bold text-poor">Delete profile</h3>
      <p className="text-ink-soft text-sm mt-1">
        Any active subscription for this child is cancelled first.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        {OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            onClick={() => {
              setMode(option.mode);
              setError("");
            }}
            aria-pressed={mode === option.mode}
            className={`text-left rounded-lg border-2 p-4 transition ${
              mode === option.mode
                ? "border-red-500 bg-red-50"
                : "border-line hover:border-red-300"
            }`}
          >
            <span className="block font-semibold text-ink">
              {option.title}
            </span>
            <span className="block text-sm text-ink-soft mt-1">
              {option.detail}
            </span>
          </button>
        ))}
      </div>

      {chosen && (
        <div className="mt-5 space-y-3">
          <label className="block text-sm text-ink-soft">
            To confirm <strong>{chosen.title.toLowerCase()}</strong>, type the
            login id <strong>{profileName}</strong>:
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              className="mt-1.5 w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </label>

          {error && <p className="text-sm text-poor">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setMode(null);
                setConfirm("");
                setError("");
              }}
              className="btn-quiet px-5 py-2.5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!confirmed || deleting}
              className="px-5 py-2.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {deleting ? "Deleting…" : chosen.title}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
