import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { allowedLevels, canAccessLevel } from "@/lib/maths";
import {
  clampSeconds,
  normaliseOption,
  parseCompletionReason,
  parseStartedAt,
} from "@/lib/tracker";

interface SubmittedAnswer {
  questionId: number;
  chosenOption: string | null;
  /** Client-reported dwell time; clamped below before it is trusted. */
  timeSpentSeconds?: number;
}

/**
 * Grades a Maths round.
 *
 * Marking is done against the stored `ansChoice`, never against anything the
 * browser sent, and the explanation is released only now that the round is
 * over. The round is then recorded in testTrackerMathMain / testTrackerMath
 * for progress tracking.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();

    const body = await request.json();
    const { answers, startedAt, subTopic, topic, level, completionReason } =
      body as {
        answers: SubmittedAnswer[];
        startedAt?: string;
        subTopic?: string | null;
        topic?: string | null;
        level?: string | null;
        completionReason?: string;
      };

    // Same gate as serving the questions, so a locked level cannot be scored.
    if (level && !canAccessLevel(await allowedLevels(session), level)) {
      return NextResponse.json(
        { error: "That difficulty level is not open to you" },
        { status: 403 }
      );
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Invalid answers format" },
        { status: 400 }
      );
    }

    const ids = answers
      .map((a) => a.questionId)
      .filter((id) => Number.isInteger(id));

    const questions = await prisma.gsMathsQuestion.findMany({
      where: { id: { in: ids } },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No matching questions" },
        { status: 404 }
      );
    }

    let correctCount = 0;
    const graded = answers
      .map((submitted, index) => {
        const question = questions.find((q) => q.id === submitted.questionId);
        if (!question) return null;

        const isCorrect = submitted.chosenOption === question.ansChoice;
        if (isCorrect) correctCount++;

        return {
          questionId: question.id,
          // Position as the round was presented, which is the order the
          // client sent them back in.
          questionOrder: index + 1,
          timeSpentSeconds: submitted.timeSpentSeconds,
          quest: question.quest,
          subTopic: question.subTopic,
          chosenOption: submitted.chosenOption,
          ansChoice: question.ansChoice,
          explanation: question.explanation,
          isCorrect,
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);

    // Record the round. A tracking failure must not cost the student their
    // result, so it is logged rather than surfaced.
    try {
      await prisma.testTrackerMathMain.create({
        data: {
          studentId: session.userId,
          testStartTime: parseStartedAt(startedAt),
          // What the round was. subTopic null marks a whole-topic test.
          topic: topic?.trim() || null,
          subTopic: subTopic?.trim() || null,
          difficultyLevel: level?.trim() || null,
          completionReason: parseCompletionReason(completionReason),
          questions: {
            create: graded.map((g) => ({
              questionId: g.questionId,
              studentId: session.userId,
              isAnsRight: g.isCorrect,
              isSkipped: g.chosenOption === null,
              timeSpentOnQuestion: clampSeconds(g.timeSpentSeconds),
              chosenOption: normaliseOption(g.chosenOption),
              correctOption: normaliseOption(g.ansChoice),
              questionOrder: g.questionOrder,
            })),
          },
        },
      });
    } catch (trackingError) {
      console.error("Failed to record maths test:", trackingError);
    }

    return NextResponse.json(
      {
        score: correctCount,
        totalCount: graded.length,
        percentage: graded.length
          ? Math.round((correctCount / graded.length) * 100)
          : 0,
        answers: graded,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Submit maths answers error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
