import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { allowedLevels, canAccessLevel } from "@/lib/student";
import {
  MAX_PASSAGE_SECONDS,
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    const { id } = await params;
    const compId = Number(id);

    if (!Number.isInteger(compId)) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    // Same difficulty gate as the GET, so a student cannot record an attempt
    // against a level that is not open to them.
    const comp = await prisma.gsEnglishComp.findUnique({
      where: { id: compId },
      select: { label: true, yearName: true, difficultyLevel: true },
    });

    if (!comp) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    if (!canAccessLevel(await allowedLevels(session), comp.difficultyLevel)) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      answers,
      startedAt,
      passageReadSeconds,
      completionReason,
    } = body as {
      answers: SubmittedAnswer[];
      startedAt?: string;
      passageReadSeconds?: number;
      completionReason?: string;
    };

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Invalid answers format" },
        { status: 400 }
      );
    }

    // Grading happens here, against the stored key - never against anything
    // the browser sent.
    //
    // Only the questions this round actually served are graded, which the
    // client names in its answers. A comprehension holds around fifty and a
    // round asks nine; grading the whole bank would mark the forty-one never
    // shown as skipped and report nine out of fifty.
    //
    // The gsEngCompId filter is the guard: a question id belonging to another
    // comprehension cannot be smuggled into this round.
    const askedIds = Array.from(
      new Set(
        answers
          .map((answer) => answer.questionId)
          .filter((id): id is number => Number.isInteger(id))
      )
    );

    const questions = await prisma.gsEnglishQuestion.findMany({
      where: { id: { in: askedIds }, gsEngCompId: compId },
      orderBy: { id: "asc" },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No matching questions for this comprehension" },
        { status: 400 }
      );
    }

    // Walk the stored questions rather than the client's array, so a question
    // the browser never sent back is recorded as skipped instead of going
    // missing. That keeps the tracker's row count equal to the round's length,
    // which is what the dashboard divides by.
    let correctCount = 0;
    const gradedAnswers = questions.map((question, index) => {
      const submitted = answers.find((a) => a.questionId === question.id);
      const chosenOption = submitted?.chosenOption ?? null;
      const isCorrect = chosenOption === question.ansChoice;
      if (isCorrect) correctCount++;

      return {
        questionId: question.id,
        chosenOption,
        isCorrect,
        ansChoice: question.ansChoice,
        /** Position as presented, which is question id order. */
        questionOrder: index + 1,
        // The skill snapshot: typeOfQuestion, not topic. topic is "Comp" on
        // every English row and groups into one useless bucket, whereas the
        // skill is what the parent report is built to report on.
        typeOfQuestion: question.typeOfQuestion,
        timeSpentSeconds: clampSeconds(submitted?.timeSpentSeconds),
      };
    });

    // Record the round. testTrackerEnglishMain is the record of an English
    // test: it feeds the last-three chips on the dashboard and the detail the
    // parent view is built on. A tracking failure must not cost the student
    // the result on screen, so it is logged rather than surfaced.
    let testId: number | null = null;
    try {
      const test = await prisma.testTrackerEnglishMain.create({
        data: {
          studentId: session.userId,
          gsEngCompId: compId,
          testStartTime: parseStartedAt(startedAt),
          // Snapshotted now, so re-tagging the comprehension later cannot move
          // this result into a different bucket.
          topic: comp.label,
          difficultyLevel: comp.difficultyLevel,
          yearName: comp.yearName,
          passageReadSeconds: clampSeconds(
            passageReadSeconds,
            MAX_PASSAGE_SECONDS
          ),
          completionReason: parseCompletionReason(completionReason),
          questions: {
            create: gradedAnswers.map((ga) => ({
              questionId: ga.questionId,
              studentId: session.userId,
              isAnsRight: ga.isCorrect,
              isSkipped: ga.chosenOption === null,
              timeSpentOnQuestion: ga.timeSpentSeconds,
              chosenOption: normaliseOption(ga.chosenOption),
              correctOption: normaliseOption(ga.ansChoice),
              questionOrder: ga.questionOrder,
              topic: ga.typeOfQuestion,
            })),
          },
        },
      });
      testId = test.id;
    } catch (trackingError) {
      console.error("Failed to record english test:", trackingError);
    }

    const detailedResult = {
      testId,
      score: correctCount,
      totalCount: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100),
      answers: gradedAnswers.map((ga) => {
        const question = questions.find((q) => q.id === ga.questionId)!;
        return {
          questionId: ga.questionId,
          quest: question.quest,
          chosenOption: ga.chosenOption,
          ansChoice: ga.ansChoice,
          isCorrect: ga.isCorrect,
        };
      }),
    };

    return NextResponse.json(detailedResult, { status: 200 });
  } catch (error) {
    console.error("Submit answer error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
