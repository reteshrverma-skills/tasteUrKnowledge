import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normaliseProfileName } from "@/lib/parent";
import { hit, tooManyRequests } from "@/lib/rate-limit";
import { guardStatus, idFrom, pupilFor, requireSchoolStaff, text } from "@/lib/school";

/** Link attempts per staff member per window, so a parent cannot be guessed. */
const MAX_TRIES = 20;
const WINDOW_MINUTES = 15;

/**
 * Teacher or School Admin: link a pupil to their parent's account, so the
 * parent sees the pupil's progress on their own dashboard - or unlink them
 * ({ unlink: true }).
 *
 * The parent's login ID AND the email on that account must both match: a
 * typo in one must never hand a child's results to a stranger. The parent
 * only views a school pupil; editing, deleting and billing stay with the
 * school (ownsManagedChild).
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireSchoolStaff();
    const body = await request.json().catch(() => ({}));

    const studentId = idFrom(body.studentId);
    if (!(await pupilFor(staff, studentId, { includeInactive: true })) || studentId === null) {
      return NextResponse.json({ error: "That pupil is not in your years" }, { status: 404 });
    }

    if (body.unlink === true) {
      await prisma.userStudentDetails.update({
        where: { studentId },
        data: { parentId: null },
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const wait = hit(`link-parent:${staff.userId}`, MAX_TRIES, WINDOW_MINUTES);
    if (wait > 0) return tooManyRequests(wait);

    const loginId = normaliseProfileName(body.parentLoginId);
    const email = text(body.parentEmail, 254)?.toLowerCase();
    if (!loginId || !email) {
      return NextResponse.json(
        { error: "Enter the parent's login ID and the email on their account" },
        { status: 400 }
      );
    }

    const parent = await prisma.userProfile.findFirst({
      where: {
        profileName: loginId,
        userType: "PARENT",
        isActive: true,
        personalDetails: { emailAddress: { equals: email, mode: "insensitive" } },
      },
      select: { id: true },
    });
    if (!parent) {
      // One message for either mismatch, so it gives away nothing.
      return NextResponse.json(
        { error: "No parent account matches that login ID and email" },
        { status: 400 }
      );
    }

    await prisma.userStudentDetails.update({
      where: { studentId },
      data: { parentId: parent.id },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const guard = guardStatus(error);
    if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
    console.error("Link parent error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
