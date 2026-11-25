import { PDFDocument } from "pdf-lib";

/**
 * Builds a student's paper as one PDF in the browser: the paper's current PDF
 * (when pages are being added) followed by each picked photo or PDF in order.
 * Photos are shrunk first - a phone photo is 3-5 MB, a readable page about
 * 300 KB - and each becomes one A4 page.
 */

/** Long edge of a photo page, in pixels: keeps handwriting sharp. */
const PHOTO_MAX_PX = 1800;
const JPEG_QUALITY = 0.8;
/** A4 in PDF points. */
const A4 = { short: 595.28, long: 841.89 };

export type SourceKind = "pdf" | "image";

export function sourceKind(file: File): SourceKind | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/.test(name)) return "image";
  return null;
}

/** A user-facing reason a file could not be added. */
export class PaperFileError extends Error {}

async function shrinkPhoto(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  let bitmap: ImageBitmap;
  try {
    // Turns the photo the right way up, as the camera recorded it.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const heic = /\.(heic|heif)$/i.test(file.name) || /hei[cf]/i.test(file.type);
    throw new PaperFileError(
      heic
        ? `${file.name} is an iPhone HEIC photo, which this browser cannot open. Upload it as a JPG instead (iPhone: Settings > Camera > Formats > Most Compatible).`
        : `${file.name} could not be opened as a photo.`
    );
  }
  const scale = Math.min(1, PHOTO_MAX_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PaperFileError("This browser cannot prepare photos.");
  // White behind transparent PNGs, which JPEG would otherwise turn black.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new PaperFileError(`${file.name} could not be prepared.`);
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
}

/**
 * The merged paper. `existing` is the paper's current PDF, or null for the
 * first upload. `onStep` reports progress ("Preparing 2 of 5").
 */
export async function mergePaper(
  existing: ArrayBuffer | null,
  sources: File[],
  onStep: (text: string) => void = () => {}
): Promise<{ bytes: Uint8Array<ArrayBuffer>; pageCount: number }> {
  const out = await PDFDocument.create();

  if (existing) {
    onStep("Opening the paper...");
    const current = await PDFDocument.load(existing);
    for (const page of await out.copyPages(current, current.getPageIndices())) out.addPage(page);
  }

  for (const [i, file] of sources.entries()) {
    onStep(`Preparing ${i + 1} of ${sources.length}...`);
    const kind = sourceKind(file);
    if (kind === "pdf") {
      let doc: PDFDocument;
      try {
        doc = await PDFDocument.load(await file.arrayBuffer());
      } catch (e) {
        const locked = e instanceof Error && /encrypt/i.test(e.message);
        throw new PaperFileError(
          locked
            ? `${file.name} is password-protected, so it cannot be added. Print it to a new PDF first, or photograph the pages.`
            : `${file.name} could not be read as a PDF.`
        );
      }
      for (const page of await out.copyPages(doc, doc.getPageIndices())) out.addPage(page);
    } else if (kind === "image") {
      const photo = await shrinkPhoto(file);
      const image = await out.embedJpg(photo.bytes);
      // A4, turned to match the photo, with the photo as large as fits.
      const landscape = photo.width > photo.height;
      const pw = landscape ? A4.long : A4.short;
      const ph = landscape ? A4.short : A4.long;
      const fit = Math.min(pw / photo.width, ph / photo.height);
      const w = photo.width * fit;
      const h = photo.height * fit;
      out.addPage([pw, ph]).drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    } else {
      throw new PaperFileError(`${file.name} is not a PDF or a photo.`);
    }
  }

  onStep("Combining into one PDF...");
  const bytes = await out.save();
  return { bytes: bytes as Uint8Array<ArrayBuffer>, pageCount: out.getPageCount() };
}
