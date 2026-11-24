import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * The answer walk-through GIF for one answer-sheet row, served as an image.
 *
 * Looked up by the tracker row the review page rendered and scoped to the
 * signed-in student, so a child only ever gets GIFs for questions they have
 * answered. Stored as a base64 data URI; sent as plain image bytes so the
 * review page never has to carry it.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ rowId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rowId } = await params;
  const id = Number(rowId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid row" }, { status: 400 });
  }

  const row = await prisma.testTrackerNvr.findFirst({
    where: { id, studentId: session.userId },
    select: { question: { select: { ansGif: true } } },
  });
  const match = row?.question?.ansGif?.match(/^data:(image\/(?:gif|png|jpeg|webp));base64,([\s\S]+)$/);
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = Buffer.from(match[2], "base64");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": match[1],
      "Content-Length": String(bytes.length),
      // Private: it sits behind the student's session.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
