import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { programmeOf } from "@/lib/programme";
import { clearBankCache } from "@/lib/bank-cache";
import { NVR_STAGES } from "@/lib/level-style";

/**
 * Admin-only: moves one Non-Verbal question to another stage and/or changes
 * its correct answer. Only questions in the admin's own programme can be
 * changed.
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

  const body = (await request.json().catch(() => null)) as { stage?: unknown; ansChoice?: unknown } | null;
  const data: { stage?: string; ansChoice?: string } = {};

  if (body?.stage !== undefined) {
    const stage = NVR_STAGES.find((s) => s === body.stage);
    if (!stage) {
      return NextResponse.json({ error: `Stage must be one of ${NVR_STAGES.join(", ")}` }, { status: 400 });
    }
    data.stage = stage;
  }

  const existing = await prisma.gsNvrQuestion.findFirst({
    where: { id, programmeCode: programmeOf(session) },
    select: { id: true, optionA: true, optionB: true, optionC: true, optionD: true, optionE: true },
  });
  if (!existing) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  if (body?.ansChoice !== undefined) {
    // Only a letter whose option actually has content can be the answer.
    const letters = (["A", "B", "C", "D", "E"] as const).filter((l) => existing[`option${l}`]?.trim());
    const ansChoice = letters.find((l) => l === body.ansChoice);
    if (!ansChoice) {
      return NextResponse.json({ error: `Answer must be one of ${letters.join(", ")}` }, { status: 400 });
    }
    data.ansChoice = ansChoice;
  }

  if (!data.stage && !data.ansChoice) {
    return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  }

  try {
    await prisma.gsNvrQuestion.update({ where: { id: existing.id }, data });
  } catch (error) {
    console.error("Error updating NVR question:", error);
    return NextResponse.json({ error: "Could not save the change" }, { status: 500 });
  }

  // Topic counts per stage are cached; the change should show at once.
  clearBankCache();
  return NextResponse.json({ id: String(existing.id), ...data });
}
