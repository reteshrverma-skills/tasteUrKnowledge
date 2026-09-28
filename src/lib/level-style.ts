/**
 * How a difficulty level and a score look, and nothing else.
 *
 * These are pure presentation, and they live apart from student.ts on purpose:
 * that module imports Prisma, so anything importing a style function from it
 * drags the database client into the browser bundle. A client component -
 * the quiz screen, for one - can import from here safely.
 *
 * student.ts and maths.ts re-export these, so existing call sites are
 * unaffected.
 */

/**
 * Colour per rung, in ladder order: green, blue, teal, violet, rose.
 *
 * These are the app's only strong hues, so a level is recognisable by colour
 * alone and everything around it can stay neutral. Maths and English share the
 * one ladder and therefore the one set of colours.
 */
export function difficultyStyle(level: string): string {
  switch (level.toLowerCase()) {
    case "starter":
      return "bg-starter-tint text-starter border-starter/25";
    case "explorer":
      return "bg-explorer-tint text-explorer border-explorer/25";
    case "navigator":
      return "bg-navigator-tint text-navigator border-navigator/25";
    case "challenger":
      return "bg-challenger-tint text-challenger border-challenger/25";
    case "master":
      return "bg-master-tint text-master border-master/25";
    default:
      return "bg-ground text-ink-soft border-line-strong";
  }
}

/**
 * Green / amber / red band for a score chip.
 *
 * 70 is the same line the strengths/weaknesses split uses, so a topic chipped
 * green here is never listed as a weakness on the parent report.
 */
export function scoreStyle(percentage: number): string {
  if (percentage >= 70) return "bg-good-tint text-good border-good/25";
  if (percentage >= 40) return "bg-fair-tint text-fair border-fair/25";
  return "bg-poor-tint text-poor border-poor/25";
}
