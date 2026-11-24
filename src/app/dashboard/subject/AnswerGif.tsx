"use client";

import { useEffect, useRef, useState } from "react";
import { decodeGif, type GifFrames } from "@/lib/gif-frames";

/**
 * "See how it's solved" on one answer-sheet question: opens the question's
 * walk-through. Rather than letting the GIF animate on its own, each frame is
 * a step the child moves through with Back / Next. Fetched only once the
 * button is pressed.
 */
export function AnswerGif({ src }: { src: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [gif, setGif] = useState<GifFrames | null>(null);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Load and decode once, the first time it is opened.
  useEffect(() => {
    if (!open || gif || failed) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(String(res.status));
        const decoded = decodeGif(await res.arrayBuffer());
        if (!cancelled) setGif(decoded);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, gif, failed, src]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !gif) return;
    c.width = gif.width;
    c.height = gif.height;
    c.getContext("2d")?.putImageData(gif.frames[step], 0, 0);
  }, [gif, step, open]);

  const total = gif?.frames.length ?? 0;
  const last = step >= total - 1;
  const next = () => setStep((s) => (s >= total - 1 ? 0 : s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const show = () => {
    setStep(0);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand hover:text-white transition"
      >
        ▶ See how it&apos;s solved
      </button>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        onKeyDown={(e) => {
          if (!total) return;
          if (e.key === "ArrowRight") next();
          if (e.key === "ArrowLeft") back();
        }}
        className="m-auto w-[min(92vw,44rem)] rounded-2xl p-0 backdrop:bg-black/60"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
          <p className="font-semibold text-ink">
            How it&apos;s solved
            {total > 1 && (
              <span className="ml-2 text-sm font-medium text-ink-soft tabular">
                Step {step + 1} of {total}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-ink-soft hover:text-ink hover:bg-ground transition"
          >
            ✕
          </button>
        </div>

        <div className="p-4 bg-white">
          {failed ? (
            <p className="py-10 text-center text-sm text-poor">Could not load the walk-through - please try again.</p>
          ) : gif ? (
            <canvas
              ref={canvas}
              role="img"
              aria-label={`Walk-through of the answer, step ${step + 1} of ${total}`}
              className="block w-full h-auto"
            />
          ) : (
            <p className="py-10 text-center text-sm text-ink-soft">Loading…</p>
          )}
        </div>

        {total > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-line">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="btn-quiet px-5 py-2 text-sm disabled:opacity-40"
            >
              ← Back
            </button>
            <div className="flex gap-1.5" aria-hidden>
              {gif!.frames.map((_, i) => (
                <span key={i} className={`h-2 w-2 rounded-full ${i === step ? "bg-brand" : "bg-line-strong"}`} />
              ))}
            </div>
            <button type="button" onClick={next} autoFocus className="btn-primary px-5 py-2 text-sm">
              {last ? "Start again ↺" : "Next step →"}
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
