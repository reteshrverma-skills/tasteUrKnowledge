import { prisma } from "@/lib/prisma";

export * from "./student-paper-limits";

/** How many papers one student may keep, across all subjects. */
export const MAX_PAPERS_PER_STUDENT = 300;

/**
 * The file's real type, from its first bytes rather than the name or what the
 * browser claims. Null for anything that is not a PDF or a photo.
 */
export function sniffType(bytes: Uint8Array): { contentType: string; ext: string } | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (ascii(0, 5) === "%PDF-") return { contentType: "application/pdf", ext: ".pdf" };
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { contentType: "image/jpeg", ext: ".jpg" };
  if (ascii(0, 8) === "\x89PNG\r\n\x1a\n") return { contentType: "image/png", ext: ".png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { contentType: "image/webp", ext: ".webp" };
  if (ascii(4, 8) === "ftyp" && ["heic", "heix", "mif1", "msf1", "hevc"].includes(ascii(8, 12))) {
    return { contentType: "image/heic", ext: ".heic" };
  }
  return null;
}

/** A display name safe to store: no path, no control characters, not too long. */
export function cleanFileName(name: string, ext: string): string {
  const base = (name.split(/[\\/]/).pop() ?? "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 200);
  return base || `paper${ext}`;
}

/** One of the student's own papers that has not been removed, or null. */
export function ownPaper(paperId: bigint, studentId: number) {
  return prisma.studentPaper.findFirst({
    where: { id: paperId, studentId, deletedAt: null },
    select: {
      id: true,
      studentId: true,
      subjectCode: true,
      name: true,
      files: {
        where: { deletedAt: null },
        orderBy: { uploadedAt: "desc" },
        select: { id: true, blobName: true, sourceCount: true },
      },
    },
  });
}

/** One of the student's own files (on a paper not removed), or null. */
export function ownFile(fileId: bigint, studentId: number) {
  return prisma.studentPaperFile.findFirst({
    where: { id: fileId, deletedAt: null, paper: { studentId, deletedAt: null } },
    select: { id: true, blobName: true, fileName: true, contentType: true },
  });
}

/** "12" or "/^\d+$/" ids from a URL, as a bigint; null if not an id. */
export function idParam(value: string): bigint | null {
  return /^\d{1,18}$/.test(value) ? BigInt(value) : null;
}
