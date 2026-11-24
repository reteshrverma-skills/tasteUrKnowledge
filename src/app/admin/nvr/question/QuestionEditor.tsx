"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NVR_STAGES, difficultyStyle } from "@/lib/level-style";

/**
 * Stage and correct-answer pickers for one question. Picking only marks the
 * choice; nothing is saved until Save is pressed.
 */
export function QuestionEditor({
  id,
  stage,
  answer,
  letters,
}: {
  id: string;
  stage: string;
  answer: string;
  letters: string[];
}) {
  const router = useRouter();
  const [saved, setSaved] = useState({ stage, answer });
  const [pickedStage, setPickedStage] = useState(stage);
  const [pickedAnswer, setPickedAnswer] = useState(answer);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const stageChanged = pickedStage.toLowerCase() !== saved.stage.toLowerCase();
  const answerChanged = pickedAnswer !== saved.answer;
  const dirty = stageChanged || answerChanged;

  const save = async () => {
    if (!dirty || saving) return;
    const changes = [
      stageChanged && `stage ${saved.stage} → ${pickedStage}`,
      answerChanged && `correct answer ${saved.answer} → ${pickedAnswer}`,
    ].filter(Boolean);
    if (!confirm(`Save question ${id}: ${changes.join(", ")}?`)) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/nvr/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(stageChanged && { stage: pickedStage }),
          ...(answerChanged && { ansChoice: pickedAnswer }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save the changes");
      setSaved({ stage: pickedStage, answer: pickedAnswer });
      setMessage({ ok: true, text: `Saved: ${changes.join(", ")}.` });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Could not save the changes" });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setPickedStage(saved.stage);
    setPickedAnswer(saved.answer);
    setMessage(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <div>
          <p className="eyebrow mb-2">Stage</p>
          <div className="flex flex-wrap gap-2">
            {NVR_STAGES.map((s) => {
              const active = s.toLowerCase() === pickedStage.toLowerCase();
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPickedStage(s)}
                  disabled={saving}
                  aria-pressed={active}
                  className={`chip chip-lg border transition disabled:opacity-60 ${
                    active ? "bg-brand text-white border-brand shadow-sm" : `${difficultyStyle(s)} hover:brightness-[0.97]`
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="eyebrow mb-2">Correct answer</p>
          <div className="flex flex-wrap gap-2">
            {letters.map((l) => {
              const active = l === pickedAnswer;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setPickedAnswer(l)}
                  disabled={saving}
                  aria-pressed={active}
                  className={`chip chip-lg border min-w-12 justify-center transition disabled:opacity-60 ${
                    active
                      ? "bg-green-600 text-white border-green-600 shadow-sm"
                      : "bg-ground text-ink border-line-strong hover:brightness-[0.97]"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={!dirty || saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        {dirty && !saving && (
          <button type="button" onClick={reset} className="text-sm font-medium text-ink-soft hover:text-brand transition">
            Reset
          </button>
        )}
        {dirty && !saving && <span className="text-sm text-ink-soft">Unsaved changes</span>}
        {message && (
          <p className={`text-sm ${message.ok ? "text-good" : "text-poor"}`} role="status">
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
