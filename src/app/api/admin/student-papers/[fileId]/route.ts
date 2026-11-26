import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { readUrl } from "@/lib/blob-storage";
import { idParam } from "@/lib/student-papers";

/**
 * Admin-only: opens a student's uploaded paper for review - a redirect to a
 * storage link that works for a few minutes. ?download=1 saves it instead.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.userType !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = idParam((await params).fileId);
  const file = id
    ? await prisma.studentPaperFile.findFirst({
        where: { id, deletedAt: null, paper: { deletedAt: null } },
        select: { blobName: true, fileName: true, contentType: true },
      })
    : null;
  if (!file) return NextResponse.json({ error: "Unknown file" }, { status: 404 });

  try {
    const download = request.nextUrl.searchParams.get("download") === "1";
    const response = NextResponse.redirect(readUrl(file.blobName, file.fileName, file.contentType, download), 302);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Admin open paper error:", error);
    return NextResponse.json({ error: "File storage is not available" }, { status: 503 });
  }
}
