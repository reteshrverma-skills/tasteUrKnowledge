import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { allowedLevels, canAccessLevel } from "@/lib/nvr";
import {
  clampSeconds,
  normaliseOption,
  parseCompletionReason,
  parseStartedAt,
} from "@/lib/tracker";

interface SubmittedAnswer {
  questionId: number;
  chosenOption: string | null;
  /** Client-reported dwell time; clamped before it is trusted. */
  timeSpentSeconds?: number;
}

/**
 * Grades a Non-Verbal round and records it.
 *
 * Marking is done against the stored ansChoice, never against anything the
 * browser sent, and ansExplain is released only now that the round is over.
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

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Invalid answers format" },
        { status: 400 }
      );
    }

    const ids = answers
      .map((answer) => answer.questionId)
      .filter((id): id is number => Number.isInteger(id));

    const questions = await prisma.gsNvrQuestion.findMany({
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
          questionOrder: index + 1,
          quest: question.quest,
          chosenOption: submitted.chosenOption,
          ansChoice: question.ansChoice,
          // Released now the round is graded, not before.
          ansExplain: question.ansExplain,
          typeOfQuestion: question.typeOfQuestion,
          timeSpentSeconds: clampSeconds(submitted.timeSpentSeconds),
          isCorrect,
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);

    // A tracking failure must not cost the student their result.
    try {
      await prisma.testTrackerNvrMain.create({
        data: {
          studentId: session.userId,
          testStartTime: parseStartedAt(startedAt),
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
              timeSpentOnQuestion: g.timeSpentSeconds,
              chosenOption: normaliseOption(g.chosenOption),
              correctOption: normaliseOption(g.ansChoice),
              questionOrder: g.questionOrder,
              // The question type, which the parent report groups by.
              topic: g.typeOfQuestion,
            })),
          },
        },
      });
    } catch (trackingError) {
      console.error("Failed to record NVR test:", trackingError);
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
    console.error("Submit NVR answers error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
