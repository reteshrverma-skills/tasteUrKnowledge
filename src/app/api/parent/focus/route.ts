import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ownsChild } from "@/lib/parent";
import { isProgressSubject } from "@/lib/focus";

/**
 * "Practise this": a parent sets a topic as their child's focus.
 *
 * ownsChild is the guard - without it, a guessed studentId would let one
 * parent put work on another family's child. Setting the same topic twice
 * returns the open one rather than stacking duplicates.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.userType !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const studentId = Number(body.studentId);
  const text = (value: unknown, max = 255) =>
    typeof value === "string" && value.trim()
      ? value.trim().slice(0, max)
      : null;
  const label = text(body.label);

  if (!isProgressSubject(body.subject) || !label) {
    return NextResponse.json({ error: "Invalid focus" }, { status: 400 });
  }
  if (!(await ownsChild(session.userId, studentId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.studentFocus.findFirst({
    where: { studentId, subject: body.subject, label, clearedAt: null },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ id: Number(existing.id) });
  }

  const created = await prisma.studentFocus.create({
    data: {
      studentId,
      setById: session.userId,
      subject: body.subject,
      label,
      topic: text(body.topic),
      subTopic: text(body.subTopic),
      level: text(body.level, 50),
    },
    select: { id: true },
  });
  return NextResponse.json({ id: Number(created.id) }, { status: 201 });
}
