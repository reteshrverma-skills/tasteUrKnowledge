import { prisma } from "@/lib/prisma";

/** The four subjects a student sees on their landing page, in display order. */
export const SUBJECT_ORDER = ["English", "Maths", "Verbal", "Non-Verbal"] as const;

/**
 * "Retesh Verma", falling back to the login id when a profile has no name on
 * it, so the greeting never renders blank.
 */
export function displayName(profile: {
  fName?: string | null;
  mName?: string | null;
  lName?: string | null;
  profileName?: string | null;
}): string {
  const full = [profile.fName, profile.mName, profile.lName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return full || profile.profileName?.trim() || "Student";
}

/** Subject that comprehensions are filed under. */
export const ENGLISH_SUBJECT_NAME = "English";

/**
 * A comprehension carries its year and subject as plain names rather than a
 * foreign key, so lookups match on the text the admin screens show.
 */
export function compWhere(yearName?: string | null, subjectName?: string | null) {
  return {
    ...(yearName ? { yearName: { equals: yearName, mode: "insensitive" as const } } : {}),
    ...(subjectName
      ? { subjectName: { equals: subjectName, mode: "insensitive" as const } }
      : {}),
  };
}

/**
 * How many questions one comprehension round asks.
 *
 * A comprehension now carries a bank of around fifty questions, far more than
 * anyone would sit in one go. Each round draws this many at random, so the
 * same passage can be practised repeatedly without simply rehearsing a fixed
 * list of answers.
 */
export const QUESTIONS_PER_COMP_ROUND = 9;

/**
 * A random draw of question ids from one comprehension, returned in ascending
 * id order.
 *
 * The draw is random but the *order* is not: questions about a passage follow
 * the text, so presenting them in id order keeps the round reading with the
 * story rather than jumping about. It also keeps questionOrder meaningful in
 * the tracker, where a fall-off in the later questions is what separates
 * "did not finish reading" from "did not understand".
 */
export async function randomCompQuestionIds(
  compId: number,
  take: number = QUESTIONS_PER_COMP_ROUND
): Promise<number[]> {
  const rows = await prisma.gsEnglishQuestion.findMany({
    where: { gsEngCompId: compId },
    select: { id: true },
  });

  const ids = rows.map((row) => row.id);

  // Fisher-Yates: every ordering equally likely, unlike sort(() => 0.5 - rnd).
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  return ids.slice(0, take).sort((a, b) => a - b);
}

/** E is optional: most questions have four choices, some have five. */
export const VALID_OPTIONS = ["A", "B", "C", "D", "E"] as const;
export const REQUIRED_OPTIONS = ["A", "B", "C", "D"] as const;

export interface QuestionInput {
  quest: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string | null;
  ansChoice: string;
  topic?: string | null;
  typeOfQuestion?: string | null;
}

/**
 * The fields a student is allowed to see - ansChoice is deliberately absent.
 *
 * `topic` is left out too: it reads "Comp" on every row and nothing renders
 * it. The skill is carried by typeOfQuestion.
 */
export const questionPublicSelect = {
  id: true,
  quest: true,
  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,
  optionE: true,
  typeOfQuestion: true,
} as const;

/**
 * Returns an error message when the payload is unusable, otherwise null.
 * A comprehension with no questions is rejected rather than silently created
 * empty, since the quiz screen has nothing to show for it.
 */
export function validateQuestions(questions: unknown): string | null {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "At least one question is required";
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] as Partial<QuestionInput>;
    const position = i + 1;

    if (!q || typeof q !== "object") {
      return `Question ${position} is invalid`;
    }
    if (!q.quest?.trim()) {
      return `Question ${position}: question text is required`;
    }
    if (
      !q.optionA?.trim() ||
      !q.optionB?.trim() ||
      !q.optionC?.trim() ||
      !q.optionD?.trim()
    ) {
      return `Question ${position}: options A to D are all required`;
    }
    if (!VALID_OPTIONS.includes(q.ansChoice as (typeof VALID_OPTIONS)[number])) {
      return `Question ${position}: correct answer must be A, B, C, D or E`;
    }
    // Answering E only makes sense when E was actually offered.
    if (q.ansChoice === "E" && !q.optionE?.trim()) {
      return `Question ${position}: correct answer is E but option E is empty`;
    }
  }

  return null;
}

/** Trims a validated draft into the shape gsEnglishQuestions stores. */
export function toQuestionData(question: QuestionInput) {
  return {
    quest: question.quest.trim(),
    optionA: question.optionA.trim(),
    optionB: question.optionB.trim(),
    optionC: question.optionC.trim(),
    optionD: question.optionD.trim(),
    optionE: question.optionE?.trim() || null,
    ansChoice: question.ansChoice,
    topic: question.topic?.trim() || null,
    typeOfQuestion: question.typeOfQuestion?.trim() || null,
  };
}
