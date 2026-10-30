import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  endTeacherTurns,
  guardStatus,
  idFrom,
  requireSchoolStaff,
  staffAccountData,
  staffInputFrom,
  text,
  yearFor,
} from "@/lib/school";

/**
 * School Admin: create a teacher login (name, email, login ID, password) and
 * optionally put them on some Years (the school's classes) straight away.
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireSchoolStaff(["SCHOOL_ADMIN"]);
    const body = await request.json().catch(() => ({}));

    const input = await staffInputFrom(body);
    if (typeof input === "string") {
      return NextResponse.json({ error: input }, { status: 400 });
    }

    // Only real Years; anything else in the list is ignored.
    const yearIds: string[] = [];
    for (const raw of Array.isArray(body.yearIds) ? body.yearIds : []) {
      const year = await yearFor(staff, text(raw));
      if (year && !yearIds.includes(year.id)) yearIds.push(year.id);
    }

    const school = await prisma.school.findUnique({
      where: { id: staff.schoolId },
      select: { programmeCode: true },
    });
    if (!school) throw new Error("Forbidden");

    const created = await prisma.userProfile.create({
      data: {
        ...(await staffAccountData(input, "TEACHER", staff.schoolId, school.programmeCode)),
        classesTaught: {
          create: yearIds.map((classId) => ({ classId, schoolId: staff.schoolId })),
        },
      },
      select: { profileName: true },
    });
    return NextResponse.json({ profileName: created.profileName }, { status: 201 });
  } catch (error) {
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Create teacher error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * School Admin: edit one of the school's teachers - name, email, login ID,
 * the Years they take, whether the account is active, and optionally a new
 * password (left blank, it is unchanged).
 *
 * Taking a teacher off a class sets removedAt on the link rather than deleting
 * it. Switching a teacher off also ends any pupil turns they have open.
 */
export async function PATCH(request: NextRequest) {
  try {
    const staff = await requireSchoolStaff(["SCHOOL_ADMIN"]);
    const body = await request.json().catch(() => ({}));

    const teacherId = idFrom(body.teacherId);
    const teacher = teacherId
      ? await prisma.userProfile.findFirst({
          where: { id: teacherId, schoolId: staff.schoolId, userType: "TEACHER" },
          select: { id: true },
        })
      : null;
    if (!teacher) {
      return NextResponse.json({ error: "That teacher is not in your school" }, { status: 404 });
    }

    const input = await staffInputFrom(body, teacher.id);
    if (typeof input === "string") {
      return NextResponse.json({ error: input }, { status: 400 });
    }
    const isActive = body.isActive !== false;

    const yearIds: string[] = [];
    for (const raw of Array.isArray(body.yearIds) ? body.yearIds : []) {
      const year = await yearFor(staff, text(raw));
      if (year && !yearIds.includes(year.id)) yearIds.push(year.id);
    }

    await prisma.$transaction(async (tx) => {
      await tx.userProfile.update({
        where: { id: teacher.id },
        data: {
          fName: input.fName,
          lName: input.lName,
          profileName: input.profileName,
          isActive,
          ...(input.password ? { profilePassword: await hashPassword(input.password) } : {}),
          personalDetails: {
            upsert: {
              create: { emailAddress: input.email },
              update: { emailAddress: input.email },
            },
          },
        },
      });
      await tx.schoolClassTeacher.updateMany({
        where: { teacherId: teacher.id, removedAt: null, classId: { notIn: yearIds } },
        data: { removedAt: new Date() },
      });
      for (const classId of yearIds) {
        await tx.schoolClassTeacher.upsert({
          where: { teacherId_classId: { teacherId: teacher.id, classId } },
          create: { teacherId: teacher.id, classId, schoolId: staff.schoolId },
          update: { removedAt: null },
        });
      }
    });

    if (!isActive) await endTeacherTurns(Number(teacher.id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Edit teacher error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
