"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** The date a test was sat, editable by the student. value is "YYYY-MM-DD" or "". */
export function TestDateField({ testId, value }: { testId: string; value: string }) {
  const router = useRouter();
  const [date, setDate] = useState(value);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/student/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testDate: date || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save the date");
      setMessage({ ok: true, text: "Saved" });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not save the date" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-2 text-sm">
      <label htmlFor={`test-date-${testId}`} className="text-ink-soft">
        Test date
      </label>
      <input
        id={`test-date-${testId}`}
        type="date"
        max={today}
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          setMessage(null);
        }}
        className="field !w-auto px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={saving || date === value}
        className="btn-primary px-3 py-1 text-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {message && (
        <span className={`text-xs ${message.ok ? "text-good" : "text-poor"}`} role="status">
          {message.text}
        </span>
      )}
    </form>
  );
}
