"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const digitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, 6);

/**
 * Change password or set / change the 6-digit Pin. Both ask for the current
 * password first, then the new value twice.
 */
export function SecretForm({ kind, hasPin = false }: { kind: "password" | "pin"; hasPin?: boolean }) {
  const router = useRouter();
  const isPin = kind === "pin";
  const [current, setCurrent] = useState("");
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const response = await fetch(isPin ? "/api/student/passcode" : "/api/student/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isPin
            ? { currentPassword: current, passcode: value, confirmPasscode: confirm }
            : { currentPassword: current, password: value, confirmPassword: confirm }
        ),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save");
      setSaved(true);
      setCurrent("");
      setValue("");
      setConfirm("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const input = (id: string, label: string, val: string, set: (v: string) => void, secret: "current" | "new") => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink-soft mb-1">
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={val}
        onChange={(e) => {
          set(isPin && secret === "new" ? digitsOnly(e.target.value) : e.target.value);
          setSaved(false);
        }}
        required
        autoComplete={secret === "current" ? "current-password" : isPin ? "off" : "new-password"}
        {...(isPin && secret === "new"
          ? { inputMode: "numeric" as const, pattern: "\\d{6}", maxLength: 6, placeholder: "6 digits" }
          : {})}
        className="field"
      />
    </div>
  );

  const noun = isPin ? "Pin" : "password";
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs text-ink-faint">
        {isPin
          ? `${hasPin ? "A Pin is set. Enter a new one to change it." : "No Pin set yet."} You can type the 6-digit Pin instead of your password on the Student login tab.`
          : "At least 6 characters. You stay signed in here; other devices are signed out."}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {input(`${kind}-current`, "Current password", current, setCurrent, "current")}
        {input(`${kind}-new`, isPin ? (hasPin ? "New Pin" : "Pin") : "New password", value, setValue, "new")}
        {input(`${kind}-confirm`, `Confirm ${isPin ? "Pin" : "new password"}`, confirm, setConfirm, "new")}
      </div>
      {error && (
        <p role="alert" className="text-sm text-poor">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-good font-semibold">
          ✓ {isPin ? "Pin" : "Password"} saved.
        </p>
      )}
      <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5">
        {saving ? "Saving…" : isPin ? (hasPin ? "Change Pin" : "Set Pin") : `Change ${noun}`}
      </button>
    </form>
  );
}
