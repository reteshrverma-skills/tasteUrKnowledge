-- Copies the English comprehensions and their questions out of Day/Question
-- and into gsEnglishComp / gsEnglishQuestions.
--
-- The old Day, Question and Answer tables are left untouched and working;
-- this is a copy, not a cutover.
--
-- Field mapping:
--   Day.content       -> gsEnglishComp.compStory
--   Day.label         -> gsEnglishComp.label
--   Subject.name      -> gsEnglishComp.subjectName
--   Year.name         -> gsEnglishComp.yearName
--   Question.text     -> gsEnglishQuestions.quest
--   Question.optionA..D -> optionA..D        (optionE has no source, left NULL)
--   Question.correctOption -> ansChoice
--   Question.dayId    -> gsEnglishQuestions.gsEngCompId (via the new comp id)
--
-- No source data exists for topic or difficultyLevel, so both are left NULL.
-- Question.order has no column in the new structure; rows are inserted in
-- (comprehension, order) sequence so the identity ids run in the right order.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/002_migrate_english_to_gs_tables.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Widen the text columns.
--    compStory was VARCHAR(255); the existing stories are 1877-4884 chars.
-- ---------------------------------------------------------------------------
ALTER TABLE "gsEnglishComp"
  ALTER COLUMN "compStory"       TYPE TEXT,
  ALTER COLUMN "difficultyLevel" TYPE TEXT;

ALTER TABLE "gsEnglishQuestions"
  ALTER COLUMN "topic"           TYPE TEXT,
  ALTER COLUMN "quest"           TYPE TEXT,
  ALTER COLUMN "optionA"         TYPE TEXT,
  ALTER COLUMN "optionB"         TYPE TEXT,
  ALTER COLUMN "optionC"         TYPE TEXT,
  ALTER COLUMN "optionD"         TYPE TEXT,
  ALTER COLUMN "optionE"         TYPE TEXT,
  ALTER COLUMN "ansChoice"       TYPE TEXT,
  ALTER COLUMN "difficultyLevel" TYPE TEXT;

-- ---------------------------------------------------------------------------
-- 2. The comprehension carries its own year / subject / label
-- ---------------------------------------------------------------------------
ALTER TABLE "gsEnglishComp"
  ADD COLUMN IF NOT EXISTS "yearName"    TEXT,
  ADD COLUMN IF NOT EXISTS "subjectName" TEXT,
  ADD COLUMN IF NOT EXISTS "label"       TEXT;

-- Temporary: lets us hang the questions off the right comp, dropped below.
ALTER TABLE "gsEnglishComp" ADD COLUMN IF NOT EXISTS "legacy_day_id" TEXT;

-- ---------------------------------------------------------------------------
-- 3. Copy the English comprehensions
-- ---------------------------------------------------------------------------
INSERT INTO "gsEnglishComp"
  ("compStory", "yearName", "subjectName", "label", "legacy_day_id")
SELECT d."content", y."name", s."name", d."label", d."id"
FROM "Day" d
JOIN "Subject" s ON s."id" = d."subjectId"
JOIN "Year"    y ON y."id" = s."yearId"
WHERE s."name" = 'English'
ORDER BY y."order", s."order", d."order";

-- ---------------------------------------------------------------------------
-- 4. Copy the questions, linked by gsEngCompId
-- ---------------------------------------------------------------------------
INSERT INTO "gsEnglishQuestions"
  ("quest", "optionA", "optionB", "optionC", "optionD", "ansChoice", "gsEngCompId")
SELECT q."text", q."optionA", q."optionB", q."optionC", q."optionD",
       q."correctOption", c."id"
FROM "Question" q
JOIN "gsEnglishComp" c ON c."legacy_day_id" = q."dayId"
ORDER BY c."id", q."order";

-- ---------------------------------------------------------------------------
-- 5. Every English question must have landed against a comprehension
-- ---------------------------------------------------------------------------
DO $$
DECLARE expected INTEGER; actual INTEGER;
BEGIN
  SELECT count(*) INTO expected
    FROM "Question" q
    JOIN "Day" d      ON d."id" = q."dayId"
    JOIN "Subject" s  ON s."id" = d."subjectId"
   WHERE s."name" = 'English';

  SELECT count(*) INTO actual FROM "gsEnglishQuestions" WHERE "gsEngCompId" IS NOT NULL;

  IF expected <> actual THEN
    RAISE EXCEPTION 'Expected % English question(s), copied % - aborting', expected, actual;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Constraints matching the Prisma models
-- ---------------------------------------------------------------------------
ALTER TABLE "gsEnglishQuestions" ALTER COLUMN "gsEngCompId" SET NOT NULL;

ALTER TABLE "gsEnglishQuestions"
  DROP CONSTRAINT IF EXISTS "gsEnglishQuestions_gsEngCompId_fkey";
ALTER TABLE "gsEnglishQuestions"
  ADD CONSTRAINT "gsEnglishQuestions_gsEngCompId_fkey"
  FOREIGN KEY ("gsEngCompId") REFERENCES "gsEnglishComp"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "gsEnglishQuestions_gsEngCompId_idx"
  ON "gsEnglishQuestions" ("gsEngCompId");

ALTER TABLE "gsEnglishComp" DROP COLUMN "legacy_day_id";

COMMIT;
