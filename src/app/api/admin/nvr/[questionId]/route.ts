import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { programmeOf } from "@/lib/programme";
import { clearBankCache } from "@/lib/bank-cache";
import { NVR_STAGES } from "@/lib/level-style";

/**
 * Admin-only: moves one Non-Verbal question to another stage. Only questions
 * in the admin's own programme can be changed.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.userType !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { questionId } = await params;
  const id = Number(questionId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { stage?: unknown } | null;
  const stage = NVR_STAGES.find((s) => s === body?.stage);
  if (!stage) {
    return NextResponse.json({ error: `Stage must be one of ${NVR_STAGES.join(", ")}` }, { status: 400 });
  }

  const existing = await prisma.gsNvrQuestion.findFirst({
    where: { id, programmeCode: programmeOf(session) },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  try {
    await prisma.gsNvrQuestion.update({ where: { id: existing.id }, data: { stage } });
  } catch (error) {
    console.error("Error updating NVR stage:", error);
    return NextResponse.json({ error: "Could not save the stage" }, { status: 500 });
  }

  // Topic counts per stage are cached; the move should show at once.
  clearBankCache();
  return NextResponse.json({ id: String(existing.id), stage });
}
