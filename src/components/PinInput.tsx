"use client";

import { useRef } from "react";

/**
 * A 6-digit Pin typed into six boxes. Typing moves to the next box, Backspace
 * goes back, the arrow keys move between boxes, and pasting "123456" (or
 * phone autofill) fills them all. `value` is the digits typed so far.
 */
export function PinInput({
  value,
  onChange,
  length = 6,
  masked = true,
  id,
  label = "Pin",
  autoFocus = false,
  boxClassName = "",
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  /** Show dots instead of the digits. */
  masked?: boolean;
  /** Given to the first box, so a <label htmlFor> focuses it. */
  id?: string;
  label?: string;
  autoFocus?: boolean;
  boxClassName?: string;
}) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focus = (i: number) => {
    const box = boxes.current[Math.max(0, Math.min(length - 1, i))];
    box?.focus();
    box?.select();
  };

  // Writes digits starting at box i; returns where the cursor ends up.
  const fill = (i: number, typed: string) => {
    const incoming = typed.replace(/\D/g, "");
    if (!incoming) return i;
    const next = digits.slice();
    let at = i;
    for (const d of incoming) {
      if (at >= length) break;
      next[at++] = d;
    }
    // Keep the digits packed from the left: no gaps in the middle.
    onChange(next.join("").slice(0, length));
    return at;
  };

  return (
    <div className="flex min-w-0 flex-1 justify-center gap-1.5 sm:gap-2.5" role="group" aria-label={label}>
      {digits.map((digit, i) => (
        <input
          key={i}
          id={i === 0 ? id : undefined}
          ref={(el) => {
            boxes.current[i] = el;
          }}
          type={masked ? "password" : "text"}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          aria-label={`${label} digit ${i + 1} of ${length}`}
          value={digit}
          onFocus={(e) => {
            // Always type into the first empty box, so digits stay in order.
            const firstEmpty = value.length;
            if (i > firstEmpty) focus(firstEmpty);
            else e.target.select();
          }}
          onChange={(e) => {
            // A phone's autofill or a fast paste can put several digits in one box.
            const typed = e.target.value.replace(digit, "") || e.target.value;
            focus(fill(i, typed));
          }}
          onPaste={(e) => {
            e.preventDefault();
            focus(fill(0, e.clipboardData.getData("text")));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              const at = digit ? i : i - 1;
              if (at < 0) return;
              onChange(value.slice(0, at) + value.slice(at + 1));
              focus(at);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              focus(i - 1);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              focus(Math.min(i + 1, value.length));
            }
          }}
          className={`h-12 min-w-0 flex-1 max-w-12 sm:h-13 rounded-xl border border-line bg-surface text-center text-xl font-semibold text-ink tabular outline-none transition focus:border-login-teal focus:ring-2 focus:ring-login-teal/25 ${boxClassName}`}
        />
      ))}
    </div>
  );
}
