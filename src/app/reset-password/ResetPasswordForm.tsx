"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const inputClass =
  "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

type State = "checking" | "ready" | "invalid" | "done";

/**
 * Sets a new password from an emailed link.
 *
 * The token is checked before the form appears, so someone following a stale
 * link learns that straight away rather than after typing a password twice.
 * The server re-checks it on submit regardless - this pass is a courtesy, not
 * a control.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  // null until the check comes back. A URL with no token at all needs no
  // request, so that case is derived at render rather than set from an effect.
  const [checked, setChecked] = useState<State | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const state: State = !token ? "invalid" : checked ?? "checking";

  useEffect(() => {
    if (!token) return;

    // Guards against a reply landing after the component has gone.
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`
        );
        if (!cancelled) setChecked(response.ok ? "ready" : "invalid");
      } catch {
        if (!cancelled) setChecked("invalid");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not set your new password");
        return;
      }

      setChecked("done");
      // Long enough to read the confirmation, short enough not to be a wait.
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">TasteUrKnowledge</h1>
          <p className="text-gray-600 mt-2">Choose a new password</p>
        </div>

        {state === "checking" && (
          <p className="text-center text-gray-600 py-6">Checking your link…</p>
        )}

        {state === "invalid" && (
          <>
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
              This reset link is no longer valid. Links work once and expire
              after an hour.
            </div>
            <Link
              href="/forgot-password"
              className="mt-5 block w-full text-center bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition"
            >
              Send me a new link
            </Link>
          </>
        )}

        {state === "done" && (
          <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm">
            Your password has been changed. Taking you to sign in…
          </div>
        )}

        {state === "ready" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={inputClass}
              />
              <p className="text-xs text-gray-500 mt-1">
                At least 6 characters.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {saving ? "Saving..." : "Set new password"}
            </button>
          </form>
        )}

        {state !== "done" && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link
              href="/login"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
