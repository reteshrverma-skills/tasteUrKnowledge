import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seniorStudentOrError } from "@/lib/student-account";

/**
 * A GCSE / A-Level student correcting one of their own loaded tests
 * (testLoadALevel). Body, either or both:
 *   { testDate: "YYYY-MM-DD" | null }  - the date they sat it
 *   { marks: [{ id, awardedMarks }] }   - awarded marks per question
 *                                         (testLoadALevelDetail)
 * Changing question marks moves the test's own awarded total by the same
 * amount. Only the student's own tests can be changed.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const session = await seniorStudentOrError();
  if (session instanceof NextResponse) return session;

  const { testId } = await params;
  if (!/^\d{1,18}$/.test(testId)) return NextResponse.json({ error: "Unknown test" }, { status: 404 });

  try {
    const body = await request.json().catch(() => ({}));
    const hasDate = "testDate" in body;
    const hasMarks = "marks" in body;
    if (!hasDate && !hasMarks) return NextResponse.json({ error: "Nothing to save" }, { status: 400 });

    let testDate: Date | null = null;
    if (hasDate && body.testDate !== null && body.testDate !== "") {
      const value = typeof body.testDate === "string" ? body.testDate : "";
      const date = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime())) {
        return NextResponse.json({ error: "Enter a valid date" }, { status: 400 });
      }
      if (date.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
        return NextResponse.json({ error: "The test date cannot be in the future" }, { status: 400 });
      }
      testDate = date;
    }

    let marks: { id: bigint; awardedMarks: number }[] = [];
    if (hasMarks) {
      if (!Array.isArray(body.marks) || body.marks.length === 0 || body.marks.length > 500) {
        return NextResponse.json({ error: "No marks to save" }, { status: 400 });
      }
      for (const m of body.marks) {
        const id = typeof m?.id === "string" || typeof m?.id === "number" ? String(m.id) : "";
        if (!/^\d{1,18}$/.test(id) || !Number.isInteger(m.awardedMarks) || m.awardedMarks < 0) {
          return NextResponse.json({ error: "Marks must be whole numbers, 0 or more" }, { status: 400 });
        }
        marks.push({ id: BigInt(id), awardedMarks: m.awardedMarks });
      }
      marks = [...new Map(marks.map((m) => [m.id, m])).values()];
    }

    const test = await prisma.testLoadALevel.findFirst({
      where: { id: BigInt(testId), studentId: session.userId },
      select: { id: true },
    });
    if (!test) return NextResponse.json({ error: "Unknown test" }, { status: 404 });

    let delta = 0;
    const updates = [];
    if (marks.length) {
      const rows = await prisma.testLoadALevelDetail.findMany({
        where: { testId: test.id, id: { in: marks.map((m) => m.id) } },
        select: { id: true, awardedMarks: true, totalMarks: true },
      });
      if (rows.length !== marks.length) {
        return NextResponse.json({ error: "Some questions are not on this test" }, { status: 400 });
      }
      for (const m of marks) {
        const row = rows.find((r) => r.id === m.id)!;
        if (m.awardedMarks > row.totalMarks) {
          return NextResponse.json(
            { error: `A question is out of ${row.totalMarks}; it cannot have ${m.awardedMarks}` },
            { status: 400 }
          );
        }
        if (m.awardedMarks === row.awardedMarks) continue;
        delta += m.awardedMarks - row.awardedMarks;
        updates.push(
          prisma.testLoadALevelDetail.update({ where: { id: m.id }, data: { awardedMarks: m.awardedMarks } })
        );
      }
    }

    await prisma.$transaction([
      ...updates,
      prisma.testLoadALevel.update({
        where: { id: test.id },
        data: {
          ...(hasDate ? { testDate } : {}),
          ...(delta ? { awardedMarks: { increment: delta } } : {}),
        },
      }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save test error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
