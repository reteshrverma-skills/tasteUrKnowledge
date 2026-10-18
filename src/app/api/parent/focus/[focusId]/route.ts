import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ownsChild } from "@/lib/parent";

/**
 * Removes a focus topic from a child's dashboard. The row is kept with
 * clearedAt set, so there is a record of what was asked and when.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ focusId: string }> }
) {
  const session = await getSession();
  if (!session || session.userType !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const focusId = Number((await params).focusId);
  if (!Number.isSafeInteger(focusId) || focusId <= 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const focus = await prisma.studentFocus.findUnique({
    where: { id: focusId },
    select: { studentId: true },
  });
  // Someone else's child's focus is simply not there for this parent.
  if (!focus || !(await ownsChild(session.userId, Number(focus.studentId)))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.studentFocus.update({
    where: { id: focusId },
    data: { clearedAt: new Date() },
  });
  return NextResponse.json({ cleared: true });
}
