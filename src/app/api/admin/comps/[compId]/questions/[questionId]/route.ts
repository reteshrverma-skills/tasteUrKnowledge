import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { toQuestionData, validateQuestions, type QuestionInput } from "@/lib/english";

async function requireAdmin() {
  const session = await getSessionOrThrow();
  return session.userType === "ADMIN";
}

/**
 * Resolves both segments, and confirms the question really belongs to the
 * comprehension in the URL rather than trusting the id on its own.
 */
async function findQuestion(compIdRaw: string, questionIdRaw: string) {
  const gsEngCompId = Number(compIdRaw);
  const id = Number(questionIdRaw);

  if (!Number.isInteger(gsEngCompId) || !Number.isInteger(id)) {
    return null;
  }

  return prisma.gsEnglishQuestion.findFirst({ where: { id, gsEngCompId } });
}

/** Edits a single question in place. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ compId: string; questionId: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { compId, questionId } = await params;
    const existing = await findQuestion(compId, questionId);
    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const body = (await request.json()) as QuestionInput;

    const questionError = validateQuestions([body]);
    if (questionError) {
      return NextResponse.json({ error: questionError }, { status: 400 });
    }

    const question = await prisma.gsEnglishQuestion.update({
      where: { id: existing.id },
      data: toQuestionData(body),
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** Deletes a single question; its recorded answers cascade away with it. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ compId: string; questionId: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { compId, questionId } = await params;
    const existing = await findQuestion(compId, questionId);
    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    await prisma.gsEnglishQuestion.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
