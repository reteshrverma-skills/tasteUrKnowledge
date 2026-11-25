-- Exam papers a GCSE / A-Level student keeps against one of their subjects:
-- a named paper (studentPaper) with up to 5 files (studentPaperFile). The
-- files themselves live in Azure Blob Storage; these rows hold only who owns
-- them, their names and where they are in the container.
--
--   * Creates two tables and their indexes. Nothing existing is changed.
--   * Removing a paper or file sets "deletedAt" (and deletes the blob); the
--     row stays.
--   * Safe to run again.
--
-- Run once:  npx prisma db execute --file prisma/sql/060_student_papers.sql --schema prisma/schema.prisma

BEGIN;

CREATE TABLE IF NOT EXISTS public."studentPaper" (
    "id"          BIGSERIAL      PRIMARY KEY,
    "studentId"   BIGINT         NOT NULL REFERENCES public."userProfile" ("id") ON DELETE CASCADE,
    "subjectCode" VARCHAR(50)    NOT NULL,
    "name"        VARCHAR(120)   NOT NULL CHECK (length(btrim("name")) > 0),
    "createdAt"   TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    "deletedAt"   TIMESTAMPTZ(3)
);

CREATE INDEX IF NOT EXISTS "studentPaper_student_subject_idx"
    ON public."studentPaper" ("studentId", "subjectCode");

CREATE TABLE IF NOT EXISTS public."studentPaperFile" (
    "id"          BIGSERIAL      PRIMARY KEY,
    "paperId"     BIGINT         NOT NULL REFERENCES public."studentPaper" ("id") ON DELETE CASCADE,
    "blobName"    VARCHAR(300)   NOT NULL UNIQUE,
    "fileName"    VARCHAR(255)   NOT NULL,
    "contentType" VARCHAR(100)   NOT NULL,
    "sizeBytes"   INTEGER        NOT NULL CHECK ("sizeBytes" > 0),
    "uploadedAt"  TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    "deletedAt"   TIMESTAMPTZ(3)
);

CREATE INDEX IF NOT EXISTS "studentPaperFile_paper_idx"
    ON public."studentPaperFile" ("paperId");

COMMIT;
