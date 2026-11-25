import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seniorStudentOrError } from "@/lib/student-account";
import { canonicalCode, studentChoices, subjectsFor } from "@/lib/senior-subjects";
import { MAX_PAPERS_PER_STUDENT, idParam } from "@/lib/student-papers";

/**
 * The paper (merged PDF holder) for a test, from the Load menu. Body either
 *   { testId }                              - an existing test of the student's;
 *                                             its paper, created if it has none
 *   { subjectCode, testName, testDate? }    - a new test (marks 0 until loaded)
 *                                             with its paper
 * Returns { paperId, testId }. The PDF itself goes to
 * /api/student/papers/[paperId]/files.
 */
export async function POST(request: NextRequest) {
  const session = await seniorStudentOrError();
  if (session instanceof NextResponse) return session;

  const body = await request.json().catch(() => ({}));

  try {
    const count = await prisma.studentPaper.count({ where: { studentId: session.userId, deletedAt: null } });
    const full = () =>
      NextResponse.json({ error: `You can keep up to ${MAX_PAPERS_PER_STUDENT} papers` }, { status: 400 });

    // An existing test.
    if (body.testId !== undefined) {
      const testId = idParam(String(body.testId));
      const test = testId
        ? await prisma.testLoadALevel.findFirst({
            where: { id: testId, studentId: session.userId },
            select: {
              id: true,
              testName: true,
              subject: true,
              papers: { where: { deletedAt: null }, select: { id: true }, take: 1 },
            },
          })
        : null;
      if (!test) return NextResponse.json({ error: "Unknown test" }, { status: 404 });
      if (test.papers[0]) {
        return NextResponse.json({ paperId: String(test.papers[0].id), testId: String(test.id) });
      }
      if (count >= MAX_PAPERS_PER_STUDENT) return full();
      const paper = await prisma.studentPaper.create({
        data: {
          studentId: session.userId,
          subjectCode: canonicalCode(session.programme, test.subject) ?? test.subject.slice(0, 50),
          name: test.testName.slice(0, 120),
          testId: test.id,
        },
        select: { id: true },
      });
      return NextResponse.json({ paperId: String(paper.id), testId: String(test.id) }, { status: 201 });
    }

    // A new test.
    const testName = typeof body.testName === "string" ? body.testName.replace(/\s+/g, " ").trim() : "";
    if (!testName) return NextResponse.json({ error: "Give the test a name" }, { status: 400 });
    if (testName.length > 120) {
      return NextResponse.json({ error: "Keep the name under 120 characters" }, { status: 400 });
    }
    const subject = subjectsFor(session.programme).find((s) => s.code === body.subjectCode);
    if (!subject) return NextResponse.json({ error: "Choose a subject" }, { status: 400 });
    const choice = (await studentChoices(session.userId, session.programme)).find(
      (c) => c.subjectCode === subject.code
    );
    if (!choice) {
      return NextResponse.json({ error: `${subject.name} is not on your subject list` }, { status: 400 });
    }

    let testDate: Date | null = null;
    if (body.testDate) {
      const raw = String(body.testDate);
      testDate = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00Z`) : null;
      if (!testDate || Number.isNaN(testDate.getTime()) || testDate.toISOString().slice(0, 10) !== raw) {
        return NextResponse.json({ error: "That date is not valid" }, { status: 400 });
      }
    }
    if (count >= MAX_PAPERS_PER_STUDENT) return full();

    const test = await prisma.testLoadALevel.create({
      data: {
        studentId: session.userId,
        testName,
        subject: subject.code,
        board: choice.boardCode,
        totalMarks: 0,
        testDate,
        papers: { create: { studentId: session.userId, subjectCode: subject.code, name: testName } },
      },
      select: { id: true, papers: { select: { id: true } } },
    });
    return NextResponse.json({ paperId: String(test.papers[0].id), testId: String(test.id) }, { status: 201 });
  } catch (error) {
    console.error("Load paper error:", error);
    return NextResponse.json({ error: "Could not set up the paper - please try again" }, { status: 500 });
  }
}
