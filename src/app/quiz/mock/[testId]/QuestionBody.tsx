"use client";

import { FigureScale, OptionFigure, StemFigure } from "@/components/NvrFigures";

export interface BodyQuestion {
  id: string;
  quest: string;
  /** Sanitised SVG markup, or null. */
  stem: string | null;
  optionFormat: string;
  /** value is text, or sanitised SVG when optionFormat is not "text". */
  options: { letter: string; value: string }[];
}

/**
 * A mock question's text, figure and options, scaled to fit the card so
 * nothing needs a scroll bar. With onChoose the options are buttons; without
 * it (the review) they are marked with the child's answer and the correct one.
 */
export function QuestionBody({
  q,
  chosen,
  correct,
  onChoose,
}: {
  q: BodyQuestion;
  chosen: string | null;
  correct?: string;
  onChoose?: (letter: string) => void;
}) {
  const figures = q.optionFormat !== "text";

  const tone = (letter: string) => {
    if (correct !== undefined) {
      if (letter === correct) return "border-good bg-good-tint";
      if (letter === chosen) return "border-poor bg-poor-tint";
      return "border-line bg-surface";
    }
    return letter === chosen ? "border-brand bg-brand-tint" : "border-line bg-surface hover:border-line-strong";
  };

  const badge = (letter: string) => {
    if (correct !== undefined) {
      if (letter === correct) return "bg-good text-white";
      if (letter === chosen) return "bg-poor text-white";
      return "bg-ground text-ink";
    }
    return letter === chosen ? "bg-brand text-white" : "bg-ground text-ink";
  };

  const Tag = onChoose ? "button" : "div";

  return (
    <FigureScale key={q.id}>
      <p className="mt-2 mb-4 text-ink whitespace-pre-line break-words">{q.quest}</p>
      {q.stem && <StemFigure markup={q.stem} />}
      {figures ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {q.options.map((o) => (
            <Tag
              key={o.letter}
              {...(onChoose ? { type: "button" as const, onClick: () => onChoose(o.letter), "aria-pressed": chosen === o.letter } : {})}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-ink transition ${tone(o.letter)}`}
            >
              <OptionFigure markup={o.value} />
              <span className={`w-7 h-7 shrink-0 rounded-full grid place-items-center text-sm font-semibold ${badge(o.letter)}`}>
                {o.letter}
              </span>
            </Tag>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {q.options.map((o) => (
            <Tag
              key={o.letter}
              {...(onChoose ? { type: "button" as const, onClick: () => onChoose(o.letter), "aria-pressed": chosen === o.letter } : {})}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition ${tone(o.letter)}`}
            >
              <span className={`w-7 h-7 shrink-0 rounded-full grid place-items-center text-sm font-semibold ${badge(o.letter)}`}>
                {o.letter}
              </span>
              <span className="text-sm text-ink break-words min-w-0">{o.value}</span>
            </Tag>
          ))}
        </div>
      )}
    </FigureScale>
  );
}
