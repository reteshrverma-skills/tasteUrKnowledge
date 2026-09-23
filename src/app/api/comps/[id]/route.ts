import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { questionPublicSelect, randomCompQuestionIds } from "@/lib/english";
import { allowedLevels, canAccessLevel } from "@/lib/student";

/**
 * One comprehension and a random round of questions from it.
 *
 * A comprehension holds a bank of around fifty questions; a round asks nine of
 * them, drawn fresh each time so the same passage stays worth repeating. The
 * questions are selected without `ansChoice`, so the answer key never reaches
 * the browser.
 */
export async function GET(
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

    const comp = await prisma.gsEnglishComp.findUnique({
      where: { id: compId },
      select: {
        id: true,
        label: true,
        compStory: true,
        yearName: true,
        subjectName: true,
        difficultyLevel: true,
      },
    });

    if (!comp) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    // A locked difficulty must not be reachable by guessing the id either.
    if (!canAccessLevel(await allowedLevels(session), comp.difficultyLevel)) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    // Drawn only once the comprehension is known to be open to this student,
    // so a locked passage never costs a query.
    const ids = await randomCompQuestionIds(comp.id);

    const questions = await prisma.gsEnglishQuestion.findMany({
      where: { id: { in: ids } },
      select: questionPublicSelect,
      // gsEnglishQuestions has no explicit order column; ids ascend in the
      // sequence the questions were added, which follows the passage.
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ ...comp, questions }, { status: 200 });
  } catch (error) {
    console.error("Get comprehension error:", error);
    // Only a genuine auth failure is reported as one. Returning 401 for every
    // error made a schema mismatch look like an expired session, which sends
    // you hunting through the login code for a bug that is not there.
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
