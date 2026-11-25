import { NextRequest, NextResponse } from "next/server";
import { seniorStudentOrError } from "@/lib/student-account";
import { readUrl } from "@/lib/blob-storage";
import { idParam, ownFile } from "@/lib/student-papers";

/**
 * Opens one of the student's paper PDFs - a redirect to a link into storage
 * that works for a few minutes. ?download=1 saves it instead. (Removing is
 * done per paper: /api/student/papers/[paperId].)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await seniorStudentOrError();
  if (session instanceof NextResponse) return session;

  const id = idParam((await params).fileId);
  const file = id ? await ownFile(id, session.userId) : null;
  if (!file) return NextResponse.json({ error: "Unknown file" }, { status: 404 });

  try {
    const download = request.nextUrl.searchParams.get("download") === "1";
    const response = NextResponse.redirect(readUrl(file.blobName, file.fileName, file.contentType, download), 302);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Open paper file error:", error);
    return NextResponse.json({ error: "File storage is not available" }, { status: 503 });
  }
}
