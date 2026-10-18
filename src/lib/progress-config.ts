import config from "@/config/progress.json";

/**
 * Typed access to src/config/progress.json, which holds the parent progress
 * page's thresholds and the English skill families. The values live in the
 * JSON so they can be changed without touching code.
 */

export const TARGET_PERCENT: number = config.targetPercent;
export const AMBER_FROM_PERCENT: number = config.amberFromPercent;
export const MIN_ANSWERS: number = config.minAnswers;
export const FOCUS_COUNT: number = config.focusCount;
export const TREND_DAYS: number = config.trendDays;

/** Where an English question type with no family in the config goes. */
export const OTHER_FAMILY = "Other skills";

/**
 * Lower case, curly apostrophes made straight and spaces collapsed, so
 * "Author’s Purpose" in the bank matches "author's purpose" in the config.
 */
export function normaliseTopic(label: string): string {
  return label
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const familyByTopic = new Map<string, string>();
for (const family of config.englishSkillFamilies) {
  for (const topic of family.topics) {
    familyByTopic.set(normaliseTopic(topic), family.name);
  }
}

/** The family names in the order the config lists them. */
export const ENGLISH_FAMILY_ORDER: string[] = config.englishSkillFamilies.map(
  (family) => family.name
);

/** The skill family an English question type belongs to. */
export function englishFamilyFor(topic: string): string {
  return familyByTopic.get(normaliseTopic(topic)) ?? OTHER_FAMILY;
}

export type Band = "good" | "fair" | "poor" | "unsure";

/**
 * Green at the target and above, amber from AMBER_FROM_PERCENT, red below it.
 * Too few answers is its own band - grey - rather than a verdict either way.
 */
export function bandFor(percentage: number, attempted: number): Band {
  if (attempted < MIN_ANSWERS) return "unsure";
  if (percentage >= TARGET_PERCENT) return "good";
  if (percentage >= AMBER_FROM_PERCENT) return "fair";
  return "poor";
}
