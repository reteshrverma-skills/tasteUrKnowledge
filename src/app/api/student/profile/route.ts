import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seniorStudentOrError } from "@/lib/student-account";

/** Blank means "cleared", so an empty string is stored as null, not "". */
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * A GCSE / A-Level student updating their own details. The row written is
 * always the session's own profile. The email is a contact email only - a
 * student never signs in with one (migration 044).
 */
export async function PUT(request: NextRequest) {
  const session = await seniorStudentOrError();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json().catch(() => ({}));
    if (!text(body.fName) || !text(body.lName)) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }
    const email = text(body.emailAddress);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const contact = {
      userAdd1: text(body.userAdd1),
      userAdd2: text(body.userAdd2),
      userAdd3: text(body.userAdd3),
      userCity: text(body.userCity),
      userCounty: text(body.userCounty),
      userZipCode: text(body.userZipCode),
      contactNumber1: text(body.contactNumber1),
      contactNumber2: text(body.contactNumber2),
      emailAddress: email,
    };

    await prisma.userProfile.update({
      where: { id: session.userId },
      data: {
        fName: text(body.fName),
        mName: text(body.mName),
        lName: text(body.lName),
        personalDetails: { upsert: { create: contact, update: contact } },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update student profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
