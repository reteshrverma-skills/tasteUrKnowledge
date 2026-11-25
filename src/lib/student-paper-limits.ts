/*
 * A paper is one merged PDF: the browser combines the student's photos and
 * PDFs into it before upload. These limits are shared with the browser
 * (LoadForm) so it can say no before doing the work.
 */

/** Photos / PDFs that can go into one paper, over all its uploads. */
export const MAX_UPLOADS_PER_PAPER = 15;
/** Pages the merged PDF may have. */
export const MAX_PAGES_PER_PAPER = 200;
/** Largest merged PDF, in bytes. */
export const MAX_FILE_BYTES = 30 * 1024 * 1024;
/** Largest single photo or PDF a student may pick, before merging. */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
