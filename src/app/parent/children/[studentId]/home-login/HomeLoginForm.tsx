"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Sets the password a school pupil uses to log in at home. */
export function HomeLoginForm({
  studentId,
  hasPassword,
}: {
  studentId: number;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const response = await fetch(`/api/parent/children/${studentId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save the password");
      setSaved(true);
      setPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className="label">
            {hasPassword ? "New password" : "Password"}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="field"
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-poor">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-good font-semibold">
          ✓ Password saved. They can now log in at home.
        </p>
      )}
      <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
        {saving ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
