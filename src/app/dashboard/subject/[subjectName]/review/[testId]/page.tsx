import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { englishTestReview } from "@/lib/english";
import { TestReview, presentOptions } from "../../../TestReview";

/**
 * Review of one past comprehension round - English or Verbal - opened from a
 * score chip on the subject page.
 */
export default async function CompTestReviewPage({
  params,
}: {
  params: Promise<{ subjectName: string; testId: string }>;
}) {
  const { subjectName, testId } = await params;
  const name = decodeURIComponent(subjectName);

  const session = await getSession();
  if (!session) redirect("/login");

  const id = Number(testId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const test = await englishTestReview(id, session.userId);
  if (!test) notFound();

  return (
    <TestReview
      backHref={`/dashboard/subject/${encodeURIComponent(name)}${
        test.difficultyLevel
          ? `?level=${encodeURIComponent(test.difficultyLevel)}`
          : ""
      }`}
      backLabel={name}
      title={test.comp.label || test.topic || "Comprehension"}
      test={test}
      passage={test.comp.compStory}
      questions={test.questions.map((row) => ({
        id: row.id,
        quest: row.question.quest,
        options: presentOptions(row.question),
        chosen: row.chosenOption,
        right: row.correctOption ?? row.question.ansChoice,
        isRight: row.isAnsRight,
      }))}
    />
  );
}
