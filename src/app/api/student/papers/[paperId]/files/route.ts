import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { seniorStudentOrError } from "@/lib/student-account";
import { blobStorageConfigured, deleteBlob, putBlob } from "@/lib/blob-storage";
import {
  MAX_FILE_BYTES,
  MAX_PAGES_PER_PAPER,
  MAX_UPLOADS_PER_PAPER,
  idParam,
  ownPaper,
  sniffType,
} from "@/lib/student-papers";

/**
 * Saves a paper's merged PDF. The browser has already combined the student's
 * photos and PDFs - plus the paper's current PDF, when pages are being added -
 * into one file, so this replaces whatever the paper had.
 *
 * Multipart form: "file" (the merged PDF), "added" (how many photos / PDFs
 * went into it this time; a paper takes MAX_UPLOADS_PER_PAPER in all) and
 * optional "replace=1" when the file replaces the paper rather than extending it.
 * Stored in Azure Blob Storage under
 * <studentId>/<subject>/<paperId>/<random>.pdf; the old blob is deleted and
 * its row marked removed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paperId: string }> }
) {
  const session = await seniorStudentOrError();
  if (session instanceof NextResponse) return session;
  if (!blobStorageConfigured()) {
    return NextResponse.json({ error: "File storage is not set up yet" }, { status: 503 });
  }

  const id = idParam((await params).paperId);
  const paper = id ? await ownPaper(id, session.userId) : null;
  if (!paper) return NextResponse.json({ error: "Unknown paper" }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const added = Number(form?.get("added"));
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Nothing to upload" }, { status: 400 });
  }
  if (!Number.isInteger(added) || added < 1) {
    return NextResponse.json({ error: "Nothing was added" }, { status: 400 });
  }

  const current = paper.files[0] ?? null;
  // "replace=1": the upload is the whole paper (Load's replace), not pages added on.
  const kept = form?.get("replace") === "1" ? 0 : (current?.sourceCount ?? 0);
  const sourceCount = kept + added;
  if (sourceCount > MAX_UPLOADS_PER_PAPER) {
    const room = MAX_UPLOADS_PER_PAPER - kept;
    return NextResponse.json(
      {
        error: room
          ? `This paper has room for ${room} more ${room === 1 ? "upload" : "uploads"} (${MAX_UPLOADS_PER_PAPER} at most)`
          : `This paper already has ${MAX_UPLOADS_PER_PAPER} uploads`,
      },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `The paper is over ${MAX_FILE_BYTES / 1024 / 1024} MB - try fewer or smaller files` },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (sniffType(bytes)?.contentType !== "application/pdf") {
    return NextResponse.json({ error: "The paper must be a PDF" }, { status: 400 });
  }
  let pageCount: number;
  try {
    pageCount = (await PDFDocument.load(bytes, { updateMetadata: false })).getPageCount();
  } catch {
    return NextResponse.json({ error: "That PDF could not be read" }, { status: 400 });
  }
  if (pageCount < 1 || pageCount > MAX_PAGES_PER_PAPER) {
    return NextResponse.json(
      { error: `A paper can have up to ${MAX_PAGES_PER_PAPER} pages; this one has ${pageCount}` },
      { status: 400 }
    );
  }

  // Subject codes are plain words ("Chemistry"); keep the folder name safe regardless.
  const subjectFolder = paper.subjectCode.replace(/[^A-Za-z0-9_-]/g, "_") || "subject";
  const blobName = `${session.userId}/${subjectFolder}/${paper.id}/${crypto.randomUUID()}.pdf`;
  const fileName = `${paper.name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").slice(0, 150)}.pdf`;

  try {
    await putBlob(blobName, bytes, "application/pdf");
  } catch (error) {
    console.error("Upload paper error:", error);
    return NextResponse.json({ error: "Could not upload the paper - please try again" }, { status: 500 });
  }

  try {
    await prisma.$transaction([
      ...(current
        ? [prisma.studentPaperFile.update({ where: { id: current.id }, data: { deletedAt: new Date() } })]
        : []),
      prisma.studentPaperFile.create({
        data: {
          paperId: paper.id,
          blobName,
          fileName,
          contentType: "application/pdf",
          sizeBytes: bytes.length,
          pageCount,
          sourceCount,
        },
      }),
    ]);
  } catch (error) {
    console.error("Save paper error:", error);
    // Nothing points at the new blob, so take it back out.
    await deleteBlob(blobName).catch(() => {});
    return NextResponse.json({ error: "Could not save the paper - please try again" }, { status: 500 });
  }

  // The old version is no longer referenced; a failure here only leaves a stray blob.
  if (current) await deleteBlob(current.blobName).catch((e) => console.error("Old paper blob not deleted:", e));

  return NextResponse.json({ pageCount, sourceCount }, { status: 201 });
}
