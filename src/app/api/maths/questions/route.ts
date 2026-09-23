import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import {
  allowedLevels,
  canAccessLevel,
  mathsQuestionPublicSelect,
  randomQuestionIds,
  randomQuestionIdsForTopic,
} from "@/lib/maths";

/**
 * A round of randomly drawn Maths questions for one subtopic + difficulty.
 * `ansChoice` and `explanation` are withheld until the round is submitted.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();

    const subTopic = request.nextUrl.searchParams.get("subTopic");
    const topic = request.nextUrl.searchParams.get("topic");
    const level = request.nextUrl.searchParams.get("level");

    if (!level || (!subTopic && !topic)) {
      return NextResponse.json(
        { error: "level plus either subTopic or topic is required" },
        { status: 400 }
      );
    }

    // A locked level must not be reachable by typing the query string.
    const access = await allowedLevels(session);
    if (!canAccessLevel(access, level)) {
      return NextResponse.json(
        { error: "That difficulty level is not open to you" },
        { status: 403 }
      );
    }

    // A subtopic round is narrower, so it wins if both are supplied.
    const ids = subTopic
      ? await randomQuestionIds(subTopic, level)
      : await randomQuestionIdsForTopic(topic!, level);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "No questions for that selection and difficulty" },
        { status: 404 }
      );
    }

    const questions = await prisma.gsMathsQuestion.findMany({
      where: { id: { in: ids } },
      select: mathsQuestionPublicSelect,
    });

    // findMany returns id order; restore the shuffled order so the round is
    // genuinely random rather than always ascending by id.
    const byId = new Map(questions.map((q) => [q.id, q]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((q): q is NonNullable<typeof q> => Boolean(q));

    return NextResponse.json(
      { subTopic, topic, level, questions: ordered },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get maths questions error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
