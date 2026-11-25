import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seniorStudentOrError } from "@/lib/student-account";
import { deleteBlob } from "@/lib/blob-storage";
import { idParam, ownPaper } from "@/lib/student-papers";

/**
 * Removes one of the student's papers: its files are deleted from storage,
 * and the paper and file rows are marked removed (deletedAt), not deleted.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ paperId: string }> }
) {
  const session = await seniorStudentOrError();
  if (session instanceof NextResponse) return session;

  const id = idParam((await params).paperId);
  const paper = id ? await ownPaper(id, session.userId) : null;
  if (!paper) return NextResponse.json({ error: "Unknown paper" }, { status: 404 });

  try {
    for (const file of paper.files) await deleteBlob(file.blobName);
    const now = new Date();
    await prisma.$transaction([
      prisma.studentPaperFile.updateMany({ where: { paperId: paper.id, deletedAt: null }, data: { deletedAt: now } }),
      prisma.studentPaper.update({ where: { id: paper.id }, data: { deletedAt: now } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove paper error:", error);
    return NextResponse.json({ error: "Could not remove the paper" }, { status: 500 });
  }
}
