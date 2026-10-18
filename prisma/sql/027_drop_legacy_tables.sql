-- Drops the four tables the app outgrew. Nothing in the code reads or writes
-- them any more:
--   "Day" / "Question"   - the first English content; copied into
--                          gsEnglishComp / gsEnglishQuestions by 002.
--   "Attempt" / "Answer" - the first English results; carried into
--                          testTrackerEnglishMain / testTrackerEnglish by 012
--                          (legacyAttemptId keeps the old Attempt.id).
--
-- THIS DELETES THEIR ROWS FOR GOOD. Take a backup first (pg_dump, or an Azure
-- point-in-time restore point) and keep it until you are sure nothing is
-- missed. Run the count below on its own first to see what is being dropped.
--
-- No CASCADE: if anything else (a view, another table's foreign key) still
-- depends on one of these, the drop fails and the transaction changes nothing.
--
-- Run once:  npx prisma db execute --file prisma/sql/027_drop_legacy_tables.sql --schema prisma/schema.prisma

-- What is about to go (safe to run on its own):
-- SELECT 'Day' AS t, count(*) FROM "Day"
-- UNION ALL SELECT 'Question', count(*) FROM "Question"
-- UNION ALL SELECT 'Attempt', count(*) FROM "Attempt"
-- UNION ALL SELECT 'Answer', count(*) FROM "Answer";

BEGIN;

-- Children before parents: Answer -> Attempt, Question -> Day.
DROP TABLE IF EXISTS public."Answer";
DROP TABLE IF EXISTS public."Attempt";
DROP TABLE IF EXISTS public."Question";
DROP TABLE IF EXISTS public."Day";

COMMIT;
