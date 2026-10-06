import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import {
  allowedLevels,
  canAccessLevel,
  nvrQuestionPublicSelect,
  randomNvrQuestionIds,
  randomNvrQuestionIdsForTopic,
  sanitiseFigure,
} from "@/lib/nvr";

/**
 * A round of Non-Verbal questions, drawn at random.
 *
 * Either `subTopic` (one subtopic) or `topic` (a wider test across all of a
 * topic's subtopics), matching the two ways the Maths picker starts a round.
 *
 * Figures are sanitised on the way out as well as being refused on the way in,
 * so a figure that reached the table by some other route still cannot run in
 * a child's browser.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();

    const params = request.nextUrl.searchParams;
    const level = params.get("level")?.trim() ?? "";
    const subTopic = params.get("subTopic")?.trim() ?? "";
    const topic = params.get("topic")?.trim() ?? "";

    if (!level || (!subTopic && !topic)) {
      return NextResponse.json(
        { error: "Choose a difficulty and a topic" },
        { status: 400 }
      );
    }

    // Same gate as every other subject: a locked level is not reachable by
    // guessing the query string either.
    if (!canAccessLevel(await allowedLevels(session), level)) {
      return NextResponse.json(
        { error: "That difficulty level is not open to you" },
        { status: 403 }
      );
    }

    const ids = subTopic
      ? await randomNvrQuestionIds(subTopic, level, topic || null)
      : await randomNvrQuestionIdsForTopic(topic, level);

    if (ids.length === 0) {
      return NextResponse.json({ questions: [] }, { status: 200 });
    }

    const rows = await prisma.gsNvrQuestion.findMany({
      where: { id: { in: ids } },
      select: nvrQuestionPublicSelect,
    });

    // findMany returns rows in whatever order it likes; the draw decided the
    // order, so restore it.
    const byId = new Map(rows.map((row) => [row.id, row]));
    const questions = ids
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => row !== undefined)
      .map((row) => ({
        ...row,
        stemFigure: sanitiseFigure(row.stemFigure),
        optionA: sanitiseFigure(row.optionA),
        optionB: sanitiseFigure(row.optionB),
        optionC: sanitiseFigure(row.optionC),
        optionD: sanitiseFigure(row.optionD),
        optionE: row.optionE ? sanitiseFigure(row.optionE) : null,
      }));

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    console.error("Get NVR questions error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
