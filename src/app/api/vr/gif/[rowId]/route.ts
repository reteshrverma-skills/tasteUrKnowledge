import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getBlob } from "@/lib/blob-storage";

/** Azure container holding the question GIFs; ansGif is the blob name in it. */
const GIF_CONTAINER = process.env.AZURE_STORAGE_GIF_CONTAINER || "grammar11";

const TYPES: Record<string, string> = {
  gif: "image/gif",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/**
 * The answer walk-through GIF for one Verbal Reasoning answer-sheet row.
 *
 * Looked up by the tracker row and scoped to the signed-in student. ansGif is
 * either a blob path in Azure (e.g. "grammar11/vr/2251.gif") or, like NVR, a
 * base64 data URI. Either way the browser only ever talks to this site.
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

  const row = await prisma.testTrackerVr.findFirst({
    where: { id: BigInt(id), studentId: BigInt(session.userId) },
    select: { question: { select: { ansGif: true } } },
  });
  const value = row?.question?.ansGif?.trim();
  if (!value) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const headers = {
    // Private: it sits behind the student's session.
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };

  const dataUri = value.match(/^data:(image\/(?:gif|png|jpeg|webp));base64,([\s\S]+)$/);
  if (dataUri) {
    const bytes = Buffer.from(dataUri[2], "base64");
    return new NextResponse(bytes, {
      headers: { ...headers, "Content-Type": dataUri[1], "Content-Length": String(bytes.length) },
    });
  }

  const type = TYPES[value.split(".").pop()?.toLowerCase() ?? ""];
  if (!type || value.includes("..")) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const blob = await getBlob(value, GIF_CONTAINER);
    const bytes = Buffer.from(await blob.arrayBuffer());
    return new NextResponse(bytes, {
      headers: { ...headers, "Content-Type": type, "Content-Length": String(bytes.length) },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
