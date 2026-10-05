import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { nvrTestReview, sanitiseFigure } from "@/lib/nvr";
import { TestReview, presentOptions } from "../../../TestReview";

/** Review of one past Non-Verbal round, opened from a score chip on the picker. */
export default async function NvrTestReviewPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  const id = Number(testId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const test = await nvrTestReview(id, session.userId);
  if (!test) notFound();

  return (
    <TestReview
      backHref={`/dashboard/subject/non-verbal${
        test.difficultyLevel
          ? `?level=${encodeURIComponent(test.difficultyLevel)}`
          : ""
      }`}
      backLabel="Non-Verbal"
      title={test.subTopic || test.topic || "Non-Verbal test"}
      test={test}
      isTopicTest={!test.subTopic && Boolean(test.topic)}
      figures
      questions={test.questions.map(({ question: q, ...row }) => ({
        id: row.id,
        quest: q.quest,
        // Figures become live markup, so they are stripped here exactly as
        // the quiz API strips them.
        stemFigure: sanitiseFigure(q.stemFigure),
        options: presentOptions({
          optionA: sanitiseFigure(q.optionA),
          optionB: sanitiseFigure(q.optionB),
          optionC: sanitiseFigure(q.optionC),
          optionD: sanitiseFigure(q.optionD),
          optionE: sanitiseFigure(q.optionE),
        }),
        chosen: row.chosenOption,
        right: row.correctOption ?? q.ansChoice,
        isRight: row.isAnsRight,
        explanation: q.ansExplain,
      }))}
    />
  );
}
