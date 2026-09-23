import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";

/** Blank means "cleared", so an empty string is stored as null, not "". */
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * A parent updating their own details.
 *
 * The row written is always the session's own profile - the id is never taken
 * from the request - so this endpoint cannot be pointed at another account.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "PARENT") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const body = await request.json();

    if (!text(body.fName) || !text(body.lName)) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
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
      emailAddress: text(body.emailAddress),
    };

    await prisma.userProfile.update({
      where: { id: session.userId },
      data: {
        fName: text(body.fName),
        mName: text(body.mName),
        lName: text(body.lName),
        // A parent who signed up without an email has no details row yet.
        personalDetails: {
          upsert: { create: contact, update: contact },
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Update parent profile error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
