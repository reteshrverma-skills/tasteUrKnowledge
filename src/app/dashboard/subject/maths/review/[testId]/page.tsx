import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { mathsTestReview } from "@/lib/maths";
import { TestReview, presentOptions } from "../../../TestReview";

/** Review of one past Maths round, opened from a score chip on the picker. */
export default async function MathsTestReviewPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  const id = Number(testId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const test = await mathsTestReview(id, session.userId);
  if (!test) notFound();

  return (
    <TestReview
      backHref={`/dashboard/subject/maths${
        test.difficultyLevel
          ? `?level=${encodeURIComponent(test.difficultyLevel)}`
          : ""
      }`}
      backLabel="Maths"
      title={test.subTopic || test.topic || "Maths test"}
      test={test}
      isTopicTest={!test.subTopic && Boolean(test.topic)}
      questions={test.questions.map((row) => ({
        id: row.id,
        quest: row.question.quest,
        options: presentOptions(row.question),
        chosen: row.chosenOption,
        right: row.correctOption ?? row.question.ansChoice,
        isRight: row.isAnsRight,
        explanation: row.question.explanation,
      }))}
    />
  );
}
