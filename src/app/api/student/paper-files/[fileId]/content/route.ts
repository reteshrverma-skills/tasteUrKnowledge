import { NextRequest, NextResponse } from "next/server";
import { seniorStudentOrError } from "@/lib/student-account";
import { getBlob } from "@/lib/blob-storage";
import { idParam, ownFile } from "@/lib/student-papers";

/**
 * The bytes of one of the student's paper PDFs, streamed through this site.
 * Used when pages are added: the browser fetches the current PDF, appends to
 * it and uploads the longer one. (The page may only fetch from this site, so
 * it cannot read from Azure directly.)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await seniorStudentOrError();
  if (session instanceof NextResponse) return session;

  const id = idParam((await params).fileId);
  const file = id ? await ownFile(id, session.userId) : null;
  if (!file) return NextResponse.json({ error: "Unknown file" }, { status: 404 });

  try {
    const blob = await getBlob(file.blobName);
    return new NextResponse(blob.body, {
      headers: {
        "Content-Type": file.contentType,
        ...(blob.headers.get("content-length") ? { "Content-Length": blob.headers.get("content-length")! } : {}),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Read paper file error:", error);
    return NextResponse.json({ error: "Could not read the paper" }, { status: 502 });
  }
}
