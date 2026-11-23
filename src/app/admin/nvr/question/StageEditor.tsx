"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NVR_STAGES, difficultyStyle } from "@/lib/level-style";

/** Stage buttons for one question; the current stage is highlighted. */
export function StageEditor({ id, stage }: { id: string; stage: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(stage);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (next: string) => {
    if (next === current || saving) return;
    if (!confirm(`Move question ${id} from ${current} to ${next}?`)) return;
    setSaving(next);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/nvr/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save the stage");
      setCurrent(next);
      setMessage({ ok: true, text: `Saved: now ${next}.` });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Could not save the stage" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <p className="eyebrow mb-2">Stage</p>
      <div className="flex flex-wrap gap-2">
        {NVR_STAGES.map((s) => {
          const active = s.toLowerCase() === current.toLowerCase();
          return (
            <button
              key={s}
              type="button"
              onClick={() => save(s)}
              disabled={saving !== null}
              aria-pressed={active}
              className={`chip chip-lg border transition disabled:opacity-60 ${
                active ? "bg-brand text-white border-brand shadow-sm" : `${difficultyStyle(s)} hover:brightness-[0.97]`
              }`}
            >
              {saving === s ? "Saving…" : s}
            </button>
          );
        })}
      </div>
      {message && (
        <p className={`text-sm mt-2 ${message.ok ? "text-good" : "text-poor"}`} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}
