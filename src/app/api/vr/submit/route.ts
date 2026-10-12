import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import {
  allowedLevels,
  canAccessLevel,
  toVrId,
  vrAnswerKey,
  whyWrong,
} from "@/lib/vr";
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
 * Grades a Verbal Reasoning round against the stored answers - never against
 * anything the browser sent - then releases the explanation and, for a wrong
 * pick, why that option was wrong. The round is recorded in
 * testTrackerVRMain / testTrackerVR.
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

    const key = await vrAnswerKey(
      answers
        .map((a) => toVrId(a.questionId))
        .filter((id): id is bigint => id !== null)
    );
    if (key.size === 0) {
      return NextResponse.json(
        { error: "No matching questions" },
        { status: 404 }
      );
    }

    let correctCount = 0;
    const graded = answers
      .map((submitted, index) => {
        const question = key.get(submitted.questionId);
        if (!question) return null;

        const chosen = normaliseOption(submitted.chosenOption);
        const isCorrect = chosen !== null && chosen === question.ansChoice;
        if (isCorrect) correctCount++;

        return {
          questionId: question.id,
          questionOrder: index + 1,
          timeSpentSeconds: submitted.timeSpentSeconds,
          quest: question.quest,
          subTopic: question.subTopic,
          chosenOption: chosen,
          ansChoice: question.ansChoice,
          explanation: question.explanation,
          whyWrong: isCorrect ? null : whyWrong(question, chosen),
          isCorrect,
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);

    // A tracking failure must not cost the student their result.
    try {
      const studentId = BigInt(session.userId);
      await prisma.testTrackerVrMain.create({
        data: {
          studentId,
          testStartTime: parseStartedAt(startedAt),
          topic: topic?.trim() || null,
          // Null marks a whole-topic test.
          subTopic: subTopic?.trim() || null,
          difficultyLevel: level?.trim() || null,
          completionReason: parseCompletionReason(completionReason),
          questions: {
            create: graded.map((g) => ({
              questionId: BigInt(g.questionId),
              studentId,
              isAnsRight: g.isCorrect,
              isSkipped: g.chosenOption === null,
              timeSpentOnQuestion: clampSeconds(g.timeSpentSeconds),
              chosenOption: g.chosenOption,
              correctOption: g.ansChoice,
              questionOrder: g.questionOrder,
            })),
          },
        },
      });
    } catch (trackingError) {
      console.error("Failed to record VR test:", trackingError);
    }

    return NextResponse.json({
      score: correctCount,
      totalCount: graded.length,
      percentage: graded.length
        ? Math.round((correctCount / graded.length) * 100)
        : 0,
      answers: graded,
    });
  } catch (error) {
    console.error("Submit VR answers error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to submit answers" },
      { status: 500 }
    );
  }
}
