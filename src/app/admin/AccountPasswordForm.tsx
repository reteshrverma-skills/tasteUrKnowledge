"use client";

import { useState } from "react";

export interface AccountOption {
  id: number;
  profileName: string;
  name: string;
  isActive: boolean;
}

const inputClass =
  "w-full px-4 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent";

/**
 * Admin screen for resetting one account's password, shared by the parent and
 * admin reset pages. The only differences between them are the endpoint it
 * posts to and the word for the account, so both are props rather than two
 * near-identical copies of this form.
 */
export function AccountPasswordForm({
  accounts,
  endpoint,
  noun,
}: {
  accounts: AccountOption[];
  endpoint: string;
  /** Singular, lower case: "parent", "admin". */
  noun: string;
}) {
  const [accountId, setAccountId] = useState("");
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
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, password, confirmPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not change the password");
        return;
      }

      setDone(`Password changed for ${data.profileName}.`);
      setPassword("");
      setConfirmPassword("");
      setAccountId("");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (accounts.length === 0) {
    return (
      <p className="text-ink-soft">There are no {noun} accounts yet.</p>
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
          htmlFor="accountId"
          className="block text-sm font-medium text-ink-soft mb-1 capitalize"
        >
          {noun} account
        </label>
        <select
          id="accountId"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Choose a {noun}…</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.profileName})
              {account.isActive ? "" : " — inactive"}
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
        The {noun} is not told automatically — pass the new password on
        yourself.
      </p>
    </form>
  );
}
