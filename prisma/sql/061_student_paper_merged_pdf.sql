-- A student's paper is now kept as ONE merged PDF: the browser combines the
-- student's photos and PDFs into a single file before upload, and adding
-- more pages later replaces it with a longer version. These columns record
-- how many pages that PDF has and how many uploads (photos / PDFs, up to 15
-- per paper) have gone into it.
--
--   * Adds two columns with defaults. No row is changed or deleted.
--   * Safe to run again.
--   * Needs migration 060 first.
--
-- Run once:  npx prisma db execute --file prisma/sql/061_student_paper_merged_pdf.sql --schema prisma/schema.prisma

BEGIN;

ALTER TABLE public."studentPaperFile"
    ADD COLUMN IF NOT EXISTS "pageCount"   INTEGER NOT NULL DEFAULT 0 CHECK ("pageCount" >= 0),
    ADD COLUMN IF NOT EXISTS "sourceCount" INTEGER NOT NULL DEFAULT 1 CHECK ("sourceCount" >= 0);

COMMIT;
