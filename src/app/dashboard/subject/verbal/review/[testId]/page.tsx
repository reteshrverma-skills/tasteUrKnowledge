import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { vrTestReview, whyWrong } from "@/lib/vr";
import { TestReview, presentOptions } from "../../../TestReview";

/** Review of one past Verbal Reasoning round, opened from a score chip. */
export default async function VrTestReviewPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  const id = Number(testId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const test = await vrTestReview(id, session.userId);
  if (!test) notFound();

  return (
    <TestReview
      backHref={`/dashboard/subject/verbal${
        test.difficultyLevel
          ? `?level=${encodeURIComponent(test.difficultyLevel)}`
          : ""
      }`}
      backLabel="Verbal Reasoning"
      title={test.subTopic || test.topic || "Verbal Reasoning test"}
      test={test}
      isTopicTest={!test.subTopic && Boolean(test.topic)}
      retryHref={`/quiz/vr?${new URLSearchParams({
        ...(test.topic ? { topic: test.topic } : {}),
        ...(test.subTopic ? { subTopic: test.subTopic } : {}),
        level: test.difficultyLevel ?? "",
      })}`}
      flagSubject="vr"
      questions={test.questions
        .filter((row) => row.question)
        .map((row) => {
          const q = row.question!;
          return {
            id: Number(row.id),
            quest: q.quest,
            options: presentOptions(q),
            chosen: row.chosenOption,
            right: row.correctOption ?? q.ansChoice,
            isRight: Boolean(row.isAnsRight),
            explanation: q.explanation,
            whyWrong: row.isAnsRight ? null : whyWrong(q, row.chosenOption),
            flagged: row.flaggedUnclear,
          };
        })}
    />
  );
}
