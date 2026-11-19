import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seniorStudentOrError } from "@/lib/student-account";

/**
 * A GCSE / A-Level student setting the date they sat one of their loaded
 * tests (testLoadALevel.testDate). Body: { testDate: "YYYY-MM-DD" | null }.
 * Only the student's own tests can be changed.
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
    let testDate: Date | null = null;
    if (body.testDate !== null && body.testDate !== "") {
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

    const { count } = await prisma.testLoadALevel.updateMany({
      where: { id: BigInt(testId), studentId: session.userId },
      data: { testDate },
    });
    if (count === 0) return NextResponse.json({ error: "Unknown test" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save test date error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
