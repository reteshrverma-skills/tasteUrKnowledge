import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { DifficultyLevel } from "@/lib/student";

/**
 * Drafts an English comprehension - a passage plus its multiple-choice
 * questions - with Claude, for an admin to review before it is saved.
 *
 * Nothing here writes to the database: the draft goes back to the admin
 * form, and saving goes through the same POST as a hand-written passage.
 */

export const MIN_GENERATED_QUESTIONS = 25;
export const MAX_GENERATED_QUESTIONS = 50;

const MODEL = "claude-opus-5-5";

/**
 * What each rung asks of a reader: the question types (the same tags the
 * existing bank uses, so the parent report groups them alongside it) and how
 * long the passage must be to carry this many questions.
 */
const LEVEL_SPEC: Record<
  DifficultyLevel,
  { types: string[]; words: string; reader: string }
> = {
  Starter: {
    types: ["direct retrieval", "basic vocabulary", "simple sequencing"],
    words: "350-450",
    reader:
      "a young or early reader: short sentences, everyday words, a clear sequence of events",
  },
  Explorer: {
    types: [
      "retrieval",
      "basic vocabulary",
      "sequencing",
      "synonyms",
      "antonyms",
      "cause/effect",
      "simple inference",
    ],
    words: "450-600",
    reader:
      "a developing reader: varied sentences, some richer vocabulary, simple cause and effect",
  },
  Navigator: {
    types: [
      "deeper inference",
      "evidence",
      "character feelings",
      "implicit meaning",
      "comparison",
    ],
    words: "550-750",
    reader:
      "a confident reader: characters with motives and feelings that are shown rather than stated",
  },
  Challenger: {
    types: [
      "viewpoint",
      "multi-step reasoning",
      "language effects",
      "motivation",
      "author's purpose",
    ],
    words: "650-850",
    reader:
      "a strong reader: figurative language, a clear authorial viewpoint, events that need linking",
  },
  Master: {
    types: [
      "structure",
      "subtle inference",
      "multiple interpretations",
      "ambiguity",
      "writer's technique",
    ],
    words: "750-950",
    reader:
      "an advanced reader: deliberate structure, ambiguity, layered meaning, crafted technique",
  },
};

const LETTERS = ["A", "B", "C", "D", "E"] as const;

export interface GeneratedQuestion {
  quest: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  ansChoice: (typeof LETTERS)[number];
  typeOfQuestion: string;
}

export interface GeneratedComprehension {
  title: string;
  story: string;
  questions: GeneratedQuestion[];
}

/** The JSON Claude must return; the API enforces it as structured output. */
function outputSchema(types: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "story", "questions"],
    properties: {
      title: { type: "string" },
      story: { type: "string" },
      questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "quest",
            "optionA",
            "optionB",
            "optionC",
            "optionD",
            "optionE",
            "ansChoice",
            "typeOfQuestion",
          ],
          properties: {
            quest: { type: "string" },
            optionA: { type: "string" },
            optionB: { type: "string" },
            optionC: { type: "string" },
            optionD: { type: "string" },
            optionE: {
              type: "string",
              description: "Empty string when the question has four options.",
            },
            ansChoice: { type: "string", enum: [...LETTERS] },
            typeOfQuestion: { type: "string", enum: types },
          },
        },
      },
    },
  };
}

/** Checks what the schema cannot: counts, and that the answer is offered. */
function validated(raw: unknown, count: number): GeneratedComprehension {
  const parsed = z
    .object({
      title: z.string().trim().min(1),
      story: z.string().trim().min(1),
      questions: z.array(
        z.object({
          quest: z.string().trim().min(1),
          optionA: z.string().trim().min(1),
          optionB: z.string().trim().min(1),
          optionC: z.string().trim().min(1),
          optionD: z.string().trim().min(1),
          optionE: z.string().trim(),
          ansChoice: z.enum(LETTERS),
          typeOfQuestion: z.string().trim().min(1),
        })
      ),
    })
    .parse(raw);

  const questions = parsed.questions.filter(
    (q) => q.ansChoice !== "E" || q.optionE !== ""
  );
  if (questions.length < count) {
    throw new GenerationError(
      `Claude returned ${questions.length} usable questions instead of ${count}. Try again.`
    );
  }
  return { ...parsed, questions: questions.slice(0, count) };
}

export class GenerationError extends Error {}

let client: Anthropic | null = null;

/**
 * The copyright guidance the admin form starts with. The admin can edit it
 * per request; the system prompt's own originality rule always applies too.
 */
export const DEFAULT_COPYRIGHT_GUIDANCE = `- Write a wholly original passage. Do not reproduce, closely paraphrase or continue any published book, story, poem, song, film, game or article.
- Do not use characters, settings, names, catchphrases or plots belonging to existing works or franchises, or real brands and trademarks.
- Do not imitate the distinctive style of a named living author.
- If the request mentions a known book or character, take only the general theme (for example "a lost pet" or "a storm at sea") and invent everything else.
- Real places, historical events and scientific facts may be described in your own words, without quoting any source.`;

/** An existing comprehension the admin chose to show Claude for level and style. */
export interface ReferenceComprehension {
  title: string;
  level: string | null;
  story: string;
  questionTypes: string[];
}

/** Long reference passages are cut here; level and style show early on. */
const REFERENCE_STORY_CHARS = 4000;

export async function generateComprehension({
  level,
  yearName,
  count,
  instructions,
  references = [],
  copyrightGuidance,
  avoidTitles = [],
}: {
  level: DifficultyLevel;
  yearName: string;
  count: number;
  /** The admin's own prompt: theme, setting, anything else to steer the draft. */
  instructions?: string | null;
  /** A few existing passages, for level and style - never to copy. */
  references?: ReferenceComprehension[];
  copyrightGuidance?: string | null;
  /** Titles already in the bank at this level, so the new one is distinct. */
  avoidTitles?: string[];
}): Promise<GeneratedComprehension> {
  const spec = LEVEL_SPEC[level];
  client ??= new Anthropic();

  const system = `You write reading comprehensions for UK primary school children preparing for 11+ style English tests.

The passage is original fiction or narrative non-fiction, safe and suitable for children, with British spelling. It must be rich enough to support every question you write: each question must be answerable from the passage alone, have exactly one defensible correct answer, and use plausible wrong options that a careless reader might choose. Spread questions across the whole passage, vary which letter is correct, and do not repeat a question in different words.

Write option E only where a fifth option genuinely helps; otherwise leave it as an empty string. Never make E the answer when it is empty.

Everything you write must be original. Passages shown to you as references are existing material from this question bank: use them only to judge reading level, length and question style. Never copy, paraphrase or continue them, and never reuse their titles, characters, plots or settings.`;

  const guidance = copyrightGuidance?.trim() || DEFAULT_COPYRIGHT_GUIDANCE;

  const referenceBlock = references.length
    ? "\n\nReference passages already in the bank (for level and style only - write something entirely different):\n" +
      references
        .map(
          (r, i) =>
            `<reference index="${i + 1}" title="${r.title}" level="${r.level ?? "unknown"}" question_types="${r.questionTypes.join(", ")}">\n${r.story.slice(0, REFERENCE_STORY_CHARS)}\n</reference>`
        )
        .join("\n")
    : "";

  const avoidBlock = avoidTitles.length
    ? `\n\nTitles already used at this level - choose a different title and subject from all of them: ${avoidTitles.join("; ")}`
    : "";

  const request = instructions?.trim()
    ? `\nThe admin's request (follow it where it fits the rules above):\n<admin_request>\n${instructions.trim()}\n</admin_request>\n`
    : "";

  const prompt = `Write one comprehension for ${yearName}, difficulty level "${level}" - ${spec.reader}.

- Passage length: ${spec.words} words, with a short title.
- Exactly ${count} multiple-choice questions.
- Tag each question with one of these question types, using every type at least once and balancing them: ${spec.types.join(", ")}.
${request}
Copyright guidance:
${guidance}${referenceBlock}${avoidBlock}`;

  const stream = client.beta.messages.stream({
    model: MODEL,
    // Streamed: a long passage plus up to 50 questions is a large output.
    max_tokens: 64000,
    // Opus 5.5 defaults to medium effort; writing fair questions earns high.
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: outputSchema(spec.types) },
    },
    // If a safety classifier declines (unlikely for children's fiction), the
    // API retries on a suitable fallback model within the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content: prompt }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new GenerationError(
      "Claude declined to write this comprehension. Try a different theme."
    );
  }
  if (message.stop_reason === "max_tokens") {
    throw new GenerationError(
      "The comprehension was cut off before it finished. Try fewer questions."
    );
  }

  const text = message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  try {
    return validated(JSON.parse(text), count);
  } catch (error) {
    if (error instanceof GenerationError) throw error;
    throw new GenerationError(
      "Claude's answer could not be read as a comprehension. Try again."
    );
  }
}
