import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { guardStatus, requireSchoolStaff } from "@/lib/school";

/**
 * Teacher: set the 4-digit PIN that ends a pupil's turn on a classroom
 * device. Needs the current password, so a child left on an unlocked teacher
 * screen cannot set one of their own.
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireSchoolStaff(["TEACHER"]);
    const body = await request.json().catch(() => ({}));

    const pin = typeof body.pin === "string" ? body.pin.trim() : "";
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "The PIN must be 4 digits" }, { status: 400 });
    }
    if (pin !== String(body.confirmPin ?? "").trim()) {
      return NextResponse.json({ error: "The PINs do not match" }, { status: 400 });
    }

    const teacher = await prisma.userProfile.findUnique({
      where: { id: staff.userId },
      select: { profilePassword: true },
    });
    if (
      !teacher ||
      typeof body.password !== "string" ||
      !(await verifyPassword(body.password, teacher.profilePassword))
    ) {
      return NextResponse.json({ error: "Your password is not right" }, { status: 400 });
    }

    await prisma.userProfile.update({
      where: { id: staff.userId },
      data: { pinHash: await hashPassword(pin) },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Set PIN error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
