import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import {
  toQuestionData,
  validateQuestions,
  type QuestionInput,
} from "@/lib/english";

/** Appends one or more questions to an existing comprehension. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { compId } = await params;
    const gsEngCompId = Number(compId);
    if (!Number.isInteger(gsEngCompId)) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Accept either a single question or a batch.
    const questions: QuestionInput[] = Array.isArray(body) ? body : [body];

    const questionError = validateQuestions(questions);
    if (questionError) {
      return NextResponse.json({ error: questionError }, { status: 400 });
    }

    const comp = await prisma.gsEnglishComp.findUnique({
      where: { id: gsEngCompId },
      select: { id: true },
    });

    if (!comp) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    await prisma.gsEnglishQuestion.createMany({
      data: questions.map((question) => ({
        ...toQuestionData(question),
        gsEngCompId,
      })),
    });

    const created = await prisma.gsEnglishQuestion.findMany({
      where: { gsEngCompId },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error adding questions to comprehension:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
