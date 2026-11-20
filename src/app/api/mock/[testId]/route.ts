import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canSitMock, hasMockAccess, saveAnswer, startNext, submitSection } from "@/lib/mock-run";

/**
 * A student sitting a mock test. POST body:
 *   { action: "start" }                                  Set 1, the next section, or Set 2 early
 *   { action: "answer", questionId, chosen, seconds }    save or change one answer (chosen null clears it)
 *   { action: "submit" }                                 hand in the running section
 * The server decides what is allowed from the clock; see src/lib/mock-run.ts.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const session = await getSession();
    const { testId } = await params;
    if (!/^\d{1,18}$/.test(testId)) return NextResponse.json({ error: "Unknown mock test" }, { status: 404 });
    const id = BigInt(testId);
    const paper = await prisma.mockTestGs.findUnique({
      where: { id },
      select: { programmeCode: true, approvedByAdmin: true },
    });
    if (!paper || !paper.approvedByAdmin) return NextResponse.json({ error: "Unknown mock test" }, { status: 404 });
    if (!canSitMock(session, paper) || !(await hasMockAccess(id, session.userId))) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    let error: string | null;
    if (body.action === "start") {
      error = await startNext(id, session.userId);
    } else if (body.action === "answer") {
      if (typeof body.questionId !== "string" || !/^\d{1,18}$/.test(body.questionId)) {
        return NextResponse.json({ error: "Unknown question" }, { status: 400 });
      }
      const chosen = typeof body.chosen === "string" ? body.chosen : null;
      const seconds = typeof body.seconds === "number" ? body.seconds : null;
      error = await saveAnswer(id, session.userId, BigInt(body.questionId), chosen, seconds);
    } else if (body.action === "submit") {
      error = await submitSection(id, session.userId);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return error
      ? NextResponse.json({ error }, { status: 409 })
      : NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mock test action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
