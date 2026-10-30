import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardStatus, idFrom, requireSchoolStaff, text, yearFor } from "@/lib/school";

/** School Admin: put one of the school's teachers on a class (coreSchoolClass). */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireSchoolStaff(["SCHOOL_ADMIN"]);
    const body = await request.json().catch(() => ({}));

    const year = await yearFor(staff, text(body.yearId));
    const teacherId = idFrom(body.teacherId);
    const teacher = teacherId
      ? await prisma.userProfile.findFirst({
          where: { id: teacherId, schoolId: staff.schoolId, userType: "TEACHER", isActive: true },
          select: { id: true },
        })
      : null;
    if (!year || !teacher) {
      return NextResponse.json({ error: "Choose a year and a teacher" }, { status: 400 });
    }

    await prisma.schoolClassTeacher.upsert({
      where: { teacherId_classId: { teacherId: teacher.id, classId: year.id } },
      create: { teacherId: teacher.id, classId: year.id, schoolId: staff.schoolId },
      // Back on a Year they had been taken off.
      update: { removedAt: null },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Assign teacher error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
