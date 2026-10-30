import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  endClassroomTurn,
  endTeacherTurns,
  guardStatus,
  idFrom,
  pupilFor,
  requireSchoolStaff,
} from "@/lib/school";

/**
 * Teacher: end pupils' turns from the teacher screen - one pupil (studentId)
 * or every turn this teacher has open (no studentId), e.g. at the end of a
 * lesson. Each device holding one is signed out on its next request.
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireSchoolStaff(["TEACHER"]);
    const body = await request.json().catch(() => ({}));

    if (body.studentId === undefined) {
      const ended = await endTeacherTurns(staff.userId);
      return NextResponse.json({ ended }, { status: 200 });
    }

    const studentId = idFrom(body.studentId);
    if (!(await pupilFor(staff, studentId)) || studentId === null) {
      return NextResponse.json({ error: "That pupil is not in your classes" }, { status: 403 });
    }
    // Any open turn for the pupil, even one another teacher of the class opened.
    const open = await prisma.classroomSession.findMany({
      where: { studentId, endedAt: null },
      select: { id: true },
    });
    for (const turn of open) {
      await endClassroomTurn(Number(turn.id), Number(studentId), "ended_by_teacher");
    }
    return NextResponse.json({ ended: open.length }, { status: 200 });
  } catch (error) {
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("End turns error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
