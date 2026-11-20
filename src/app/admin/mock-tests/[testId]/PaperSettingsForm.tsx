"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SectionRow {
  id: string;
  setNo: number;
  subject: string;
  durationMinutes: number;
}

interface Settings {
  name: string;
  stage: string;
  testDate: string;
  availableDays: number;
  breakMinutes: number;
  sections: SectionRow[];
}

/** Name, stage, opening date, days open, break and each section's time. */
export function PaperSettingsForm({
  testId,
  stages,
  locked,
  initial,
}: {
  testId: string;
  stages: string[];
  /** Students have started: break and section times cannot change. */
  locked: boolean;
  initial: Settings;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setMessage(null);
  };
  const setMinutes = (id: string, minutes: number) => {
    setForm((f) => ({ ...f, sections: f.sections.map((s) => (s.id === id ? { ...s, durationMinutes: minutes } : s)) }));
    setMessage(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/mock-tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sections: form.sections.map((s) => ({ id: s.id, durationMinutes: s.durationMinutes })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save the settings");
      setMessage({ ok: true, text: "Saved" });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not save the settings" });
    } finally {
      setSaving(false);
    }
  };

  const input = "field px-3 py-2 text-sm";
  const setTotal = (setNo: number) =>
    form.sections.filter((s) => s.setNo === setNo).reduce((n, s) => n + (s.durationMinutes || 0), 0);

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Name</span>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} required className={input} />
        </label>
        <label className="block">
          <span className="label">Stage</span>
          <select value={form.stage} onChange={(e) => set("stage", e.target.value)} className={input}>
            <option value="">No stage</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Opening date</span>
          <input type="date" value={form.testDate} onChange={(e) => set("testDate", e.target.value)} required className={input} />
        </label>
        <label className="block">
          <span className="label">Days open</span>
          <input
            type="number"
            min={1}
            max={365}
            value={form.availableDays}
            onChange={(e) => set("availableDays", Number(e.target.value))}
            required
            className={input}
          />
        </label>
        <label className="block">
          <span className="label">Break between Set 1 and Set 2 (minutes)</span>
          <input
            type="number"
            min={0}
            max={120}
            value={form.breakMinutes}
            onChange={(e) => set("breakMinutes", Number(e.target.value))}
            disabled={locked}
            required
            className={input}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((setNo) => (
          <fieldset key={setNo} className="rounded-lg border border-line p-4" disabled={locked}>
            <legend className="px-1 text-sm font-semibold text-ink">
              Set {setNo} · {setTotal(setNo)} minutes
            </legend>
            {form.sections.filter((s) => s.setNo === setNo).length === 0 && (
              <p className="text-sm text-ink-soft">Not loaded yet.</p>
            )}
            <div className="space-y-2">
              {form.sections
                .filter((s) => s.setNo === setNo)
                .map((s) => (
                  <label key={s.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink">{s.subject}</span>
                    <span className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={s.durationMinutes}
                        onChange={(e) => setMinutes(s.id, Number(e.target.value))}
                        required
                        className="field !w-20 px-2 py-1 text-sm"
                      />
                      <span className="text-ink-soft">min</span>
                    </span>
                  </label>
                ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
          {saving ? "Saving..." : "Save settings"}
        </button>
        {message && (
          <span className={`text-sm ${message.ok ? "text-good" : "text-poor"}`} role="status">
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
