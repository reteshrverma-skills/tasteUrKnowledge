import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";

/**
 * Marks (or unmarks) one answer-sheet row as "answer not clear".
 *
 * The row id is the tracker row the review page rendered. The update is
 * scoped to the signed-in student, so a guessed id cannot touch anyone
 * else's sheet - it simply matches nothing.
 */
export async function POST(request: NextRequest) {
  let session;
  try {
    session = await getSessionOrThrow();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subject, rowId, flagged } = (await request.json()) as {
      subject?: string;
      rowId?: number;
      flagged?: boolean;
    };

    if (!Number.isSafeInteger(rowId) || (rowId as number) <= 0) {
      return NextResponse.json({ error: "Invalid row" }, { status: 400 });
    }
    if (typeof flagged !== "boolean") {
      return NextResponse.json({ error: "Invalid flag" }, { status: 400 });
    }

    const data = {
      flaggedUnclear: flagged,
      flaggedUnclearAt: flagged ? new Date() : null,
    };

    let updated: number;
    if (subject === "nvr") {
      ({ count: updated } = await prisma.testTrackerNvr.updateMany({
        where: { id: rowId, studentId: session.userId },
        data,
      }));
    } else if (subject === "vr") {
      ({ count: updated } = await prisma.testTrackerVr.updateMany({
        where: { id: BigInt(rowId!), studentId: BigInt(session.userId) },
        data,
      }));
    } else if (subject === "maths") {
      ({ count: updated } = await prisma.testTrackerMath.updateMany({
        where: { id: rowId, studentId: session.userId },
        data,
      }));
    } else {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
    }

    if (updated === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ flagged });
  } catch (error) {
    console.error("Error flagging answer:", error);
    return NextResponse.json(
      { error: "Could not save that - please try again" },
      { status: 500 }
    );
  }
}
