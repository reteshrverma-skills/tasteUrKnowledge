/**
 * Shared rules for turning what a browser reports about a round into something
 * safe to store in the tracker tables.
 *
 * Both subjects go through here so a Maths second and an English second mean
 * the same thing when the two tables are unioned for the parent view.
 */

/**
 * A question nobody could spend more than this on is a stuck clock, not a
 * thinking student. Bounding it keeps one bad value out of every average.
 */
export const MAX_SECONDS_PER_QUESTION = 3600;

/** Reading a passage is slower than answering, so it gets its own ceiling. */
export const MAX_PASSAGE_SECONDS = 7200;

export function clampSeconds(
  value: unknown,
  max: number = MAX_SECONDS_PER_QUESTION
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.min(value, max);
}

/** Only accept a start time that is in the past and plausibly recent. */
export function parseStartedAt(value: unknown): Date {
  const now = Date.now();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed) && parsed <= now && now - parsed <= 86_400_000) {
      return new Date(parsed);
    }
  }
  return new Date(now);
}

/** How a round ended. Anything unrecognised is recorded as null, not guessed. */
export const COMPLETION_REASONS = [
  "submitted",
  "timed_out",
  "abandoned",
] as const;

export type CompletionReason = (typeof COMPLETION_REASONS)[number];

export function parseCompletionReason(value: unknown): CompletionReason | null {
  return typeof value === "string" &&
    (COMPLETION_REASONS as readonly string[]).includes(value)
    ? (value as CompletionReason)
    : null;
}

/**
 * Only A-E is stored, so a malformed or oversized value from the client can
 * never land in a VARCHAR(1) column and fail the whole insert.
 */
export function normaliseOption(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const letter = value.trim().toUpperCase();
  return /^[A-E]$/.test(letter) ? letter : null;
}
