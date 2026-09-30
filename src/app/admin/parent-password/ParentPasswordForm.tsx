"use client";

import { useState } from "react";

export interface ParentOption {
  id: number;
  profileName: string;
  name: string;
  isActive: boolean;
}

const inputClass =
  "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent";

export function ParentPasswordForm({ parents }: { parents: ParentOption[] }) {
  const [parentId, setParentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDone("");
    setSaving(true);

    try {
      const response = await fetch("/api/admin/parent-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, password, confirmPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not change the password");
        return;
      }

      setDone(`Password changed for ${data.profileName}.`);
      setPassword("");
      setConfirmPassword("");
      setParentId("");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (parents.length === 0) {
    return (
      <p className="text-ink-soft">
        There are no parent accounts yet.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm"
        >
          {error}
        </div>
      )}
      {done && (
        <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm">
          {done}
        </div>
      )}

      <div>
        <label
          htmlFor="parentId"
          className="block text-sm font-medium text-ink-soft mb-1"
        >
          Parent account
        </label>
        <select
          id="parentId"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Choose a parent…</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name} ({parent.profileName})
              {parent.isActive ? "" : " — inactive"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-ink-soft mb-1"
        >
          New password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="text-xs text-ink-faint mt-1">At least 6 characters.</p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-ink-soft mb-1"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
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
        className="bg-brand text-white px-6 py-2.5 rounded-lg font-bold hover:bg-brand-hover disabled:opacity-50 transition"
      >
        {saving ? "Changing…" : "Change password"}
      </button>

      <p className="text-xs text-ink-faint">
        The parent is not told automatically — pass the new password on
        yourself. Any reset link they already have stops working.
      </p>
    </form>
  );
}
