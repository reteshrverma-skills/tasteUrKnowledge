-- A test started from the Load menu has its paper uploaded before its marks
-- are known, so it is created with totalMarks = 0 ("Marks not loaded yet").
-- Migration 047 required totalMarks > 0; this allows 0 and keeps the rest:
-- awarded marks are never negative and never above the total.
--
--   * Replaces one CHECK constraint. No row is changed or deleted.
--   * Safe to run again.
--
-- Run once:  npx prisma db execute --file prisma/sql/063_test_load_alevel_no_marks_yet.sql --schema prisma/schema.prisma

BEGIN;

ALTER TABLE public."testLoadALevel"
    DROP CONSTRAINT IF EXISTS "testLoadALevel_marks_check";

ALTER TABLE public."testLoadALevel"
    ADD CONSTRAINT "testLoadALevel_marks_check"
        CHECK ("totalMarks" >= 0 AND "awardedMarks" >= 0 AND "awardedMarks" <= "totalMarks");

COMMIT;
