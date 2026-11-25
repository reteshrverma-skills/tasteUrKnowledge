-- Links a student's paper (the merged PDF) to the test it belongs to, so the
-- Load menu can upload a paper for a new or an existing test and the subject
-- page can offer View / Download on each test.
--
--   * Adds one nullable column and an index. No row is changed or deleted.
--   * One live paper per test: a partial unique index over papers not removed.
--   * Safe to run again.
--   * Needs migrations 060 and 061 first.
--
-- Run once:  npx prisma db execute --file prisma/sql/062_student_paper_test.sql --schema prisma/schema.prisma

BEGIN;

ALTER TABLE public."studentPaper"
    ADD COLUMN IF NOT EXISTS "testId" BIGINT NULL
        REFERENCES public."testLoadALevel"(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "studentPaper_test_live_key"
    ON public."studentPaper" ("testId")
    WHERE "testId" IS NOT NULL AND "deletedAt" IS NULL;

COMMIT;
