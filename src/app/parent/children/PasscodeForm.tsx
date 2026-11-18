"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const digitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, 6);

/** Sets or resets the 6-digit passcode a child can log in with. */
export function PasscodeForm({
  studentId,
  hasPasscode,
  inputClassName = "field",
}: {
  studentId: number;
  hasPasscode: boolean;
  inputClassName?: string;
}) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const response = await fetch(`/api/parent/children/${studentId}/passcode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, confirmPasscode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save the Pin");
      setSaved(true);
      setPasscode("");
      setConfirmPasscode("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the Pin");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink-soft mb-1">
        {label}
      </label>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        value={value}
        onChange={(e) => {
          set(digitsOnly(e.target.value));
          setSaved(false);
        }}
        required
        autoComplete="off"
        placeholder="6 digits"
        className={inputClassName}
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs text-ink-faint">
        {hasPasscode ? "A Pin is set. Enter a new one to reset it." : "No Pin set yet."} Your
        child can type the 6-digit Pin instead of their password on the login page.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field(`passcode-${studentId}`, hasPasscode ? "New Pin" : "Pin", passcode, setPasscode)}
        {field(`confirmPasscode-${studentId}`, "Confirm Pin", confirmPasscode, setConfirmPasscode)}
      </div>
      {error && (
        <p role="alert" className="text-sm text-poor">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-good font-semibold">
          ✓ Pin saved.
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="btn-primary px-6 py-2.5"
      >
        {saving ? "Saving…" : hasPasscode ? "Reset Pin" : "Set Pin"}
      </button>
    </form>
  );
}
