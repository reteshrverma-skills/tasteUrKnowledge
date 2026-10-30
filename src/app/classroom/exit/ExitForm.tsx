"use client";

import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full px-4 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent";

/** The teacher's PIN (or password); on success the device returns to them. */
export function ExitForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/classroom/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "That is not right");
      // A full page load, so nothing of the pupil's pages stays in memory.
      window.location.assign(data.redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That is not right");
      setCode("");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 text-left">
      <label className="block">
        <span className="text-sm font-medium text-ink">Teacher PIN or password</span>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoFocus
          required
          className={`${inputClass} mt-1`}
        />
      </label>
      {error && <p className="text-sm text-poor" role="alert">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full py-2.5 disabled:opacity-50">
        {saving ? "Checking…" : "Back to teacher"}
      </button>
      <Link href="/dashboard" className="block text-center text-sm text-ink-soft hover:text-brand">
        Keep practising
      </Link>
    </form>
  );
}
