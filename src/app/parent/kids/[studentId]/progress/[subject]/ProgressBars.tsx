import type { SkillArea, SkillFamily } from "@/lib/progress";
import {
  AMBER_FROM_PERCENT,
  MIN_ANSWERS,
  TARGET_PERCENT,
  bandFor,
  type Band,
} from "@/lib/progress-config";

/**
 * Colour plus an icon for each band, so the reading does not depend on telling
 * red from green. "Unsure" - too few answers - is grey and striped rather than
 * a verdict, so one wrong answer out of three does not look alarming.
 */
const BAND: Record<
  Band,
  { fill: string; text: string; icon: string; name: string }
> = {
  good: { fill: "bg-good", text: "text-good", icon: "✓", name: "On target" },
  fair: { fill: "bg-fair", text: "text-fair", icon: "◐", name: "Getting there" },
  poor: { fill: "bg-poor", text: "text-poor", icon: "!", name: "Needs work" },
  unsure: {
    fill: "bg-ink-faint/50",
    text: "text-ink-faint",
    icon: "?",
    name: "Too few answers",
  },
};

const STRIPES = {
  backgroundImage:
    "repeating-linear-gradient(135deg, transparent 0 4px, rgba(255,255,255,0.55) 4px 8px)",
};

/** "24% → 31% ↑": direction matters more to a parent than the number. */
export function Trend({
  previous,
  current,
}: {
  previous: number | null;
  current: number;
}) {
  if (previous === null) return null;
  const diff = current - previous;
  const arrow = diff >= 1 ? "↑" : diff <= -1 ? "↓" : "→";
  const tone = diff >= 1 ? "text-good" : diff <= -1 ? "text-poor" : "text-ink-faint";
  return (
    <span
      className="text-xs text-ink-faint tabular whitespace-nowrap"
      title="Change over the last week"
    >
      {previous}% → {current}%{" "}
      <span className={`font-bold ${tone}`} aria-label={diff >= 1 ? "up" : diff <= -1 ? "down" : "level"}>
        {arrow}
      </span>
    </span>
  );
}

/** One horizontal bar with the dashed target line and correct/total. */
export function ScoreBar({
  label,
  percentage,
  correct,
  attempted,
  previous,
  strong = false,
}: {
  label: string;
  percentage: number;
  correct: number;
  attempted: number;
  previous: number | null;
  /** Bolder label, for a family heading. */
  strong?: boolean;
}) {
  const band = bandFor(percentage, attempted);
  const style = BAND[band];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,13rem)_1fr_auto] items-center gap-x-4 gap-y-1">
      <div className="min-w-0">
        <p className={`truncate ${strong ? "font-semibold text-ink" : "text-ink"}`}>
          {label}
        </p>
        <Trend previous={previous} current={percentage} />
      </div>

      <div
        className={`relative h-3 rounded-full bg-line ${band === "unsure" ? "opacity-70" : ""}`}
        role="img"
        aria-label={`${label}: ${percentage}%, ${style.name}`}
      >
        <div
          className={`h-full rounded-full ${style.fill}`}
          style={{
            width: `${Math.max(percentage, 2)}%`,
            ...(band === "unsure" ? STRIPES : {}),
          }}
        />
        {/* The target every bar is measured against. */}
        <div
          className="absolute -top-1 -bottom-1 border-l-2 border-dashed border-ink-soft"
          style={{ left: `${TARGET_PERCENT}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="flex items-center justify-end gap-2 tabular text-sm whitespace-nowrap">
        <span className="text-ink-faint text-xs">
          {correct}/{attempted}
        </span>
        <span className={`font-semibold ${style.text}`}>
          <span aria-hidden="true">{style.icon}</span> {percentage}%
        </span>
      </div>
    </div>
  );
}

/** The key under the bars, so the colours and the dashed line are explained. */
export function BarLegend() {
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft mt-2">
      <span>
        <span className="text-good font-bold">✓</span> {TARGET_PERCENT}% and above
      </span>
      <span>
        <span className="text-fair font-bold">◐</span> {AMBER_FROM_PERCENT}–
        {TARGET_PERCENT - 1}%
      </span>
      <span>
        <span className="text-poor font-bold">!</span> below {AMBER_FROM_PERCENT}%
      </span>
      <span>
        <span className="text-ink-faint font-bold">?</span> fewer than {MIN_ANSWERS} answers
      </span>
      <span>
        <span className="inline-block w-3 border-t-2 border-dashed border-ink-soft align-middle" />{" "}
        {TARGET_PERCENT}% target
      </span>
    </p>
  );
}

/** Topics as bars, weakest first (the order they arrive in). */
export function AreaBars({ areas }: { areas: SkillArea[] }) {
  return (
    <div className="space-y-4">
      {areas.map((area) => (
        <ScoreBar
          key={area.label}
          label={area.label}
          percentage={area.percentage}
          correct={area.correct}
          attempted={area.attempted}
          previous={area.previousPercentage}
        />
      ))}
    </div>
  );
}

/**
 * English: one bar per skill family, weakest first, each opening to show the
 * question types inside it.
 */
export function FamilyBars({ families }: { families: SkillFamily[] }) {
  return (
    <div className="space-y-3">
      {families.map((family) => (
        <details key={family.name} className="group rounded-xl border border-line">
          <summary className="cursor-pointer list-none px-4 py-3">
            <div className="flex items-start gap-2">
              <span
                className="text-ink-faint text-xs mt-1.5 transition-transform group-open:rotate-90"
                aria-hidden="true"
              >
                ▶
              </span>
              <div className="flex-1 min-w-0">
                <ScoreBar
                  label={family.name}
                  percentage={family.percentage}
                  correct={family.correct}
                  attempted={family.attempted}
                  previous={family.previousPercentage}
                  strong
                />
              </div>
            </div>
          </summary>
          <div className="px-4 pb-4 pl-9 pt-1 border-t border-line">
            <div className="pt-3">
              <AreaBars areas={family.areas} />
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
