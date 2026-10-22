import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listYears } from "@/lib/parent";
import {
  DEFAULT_COPYRIGHT_GUIDANCE,
  MAX_GENERATED_QUESTIONS,
  MIN_GENERATED_QUESTIONS,
} from "@/lib/comp-generator";
import { ENGLISH_SUBJECT_NAME } from "@/lib/english";
import { Generator } from "./Generator";

/**
 * Admin-only: draft a new English comprehension with Claude.
 *
 * The admin writes a prompt, picks the level, chooses existing passages as
 * references and can adjust the copyright guidance. The draft is shown here
 * only - nothing reaches students unless the admin saves it (as unapproved)
 * and then approves it on the English Comprehension page.
 */
export default async function GenerateComprehensionPage() {
  const session = await getSession();
  // The proxy guards /admin, but a page that calls Claude checks again.
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const [years, comps] = await Promise.all([
    listYears(),
    prisma.gsEnglishComp.findMany({
      where: { subjectName: { equals: ENGLISH_SUBJECT_NAME, mode: "insensitive" } },
      select: {
        id: true,
        label: true,
        difficultyLevel: true,
        yearName: true,
        approvedByAdmin: true,
        _count: { select: { questions: true } },
      },
      orderBy: { id: "desc" },
    }),
  ]);

  return (
    <Generator
      years={years}
      comps={comps.map((c) => ({
        id: Number(c.id),
        title: c.label?.trim() || "Untitled",
        level: c.difficultyLevel,
        yearName: c.yearName,
        approved: Boolean(c.approvedByAdmin),
        questionCount: c._count.questions,
      }))}
      defaultGuidance={DEFAULT_COPYRIGHT_GUIDANCE}
      minQuestions={MIN_GENERATED_QUESTIONS}
      maxQuestions={MAX_GENERATED_QUESTIONS}
    />
  );
}
