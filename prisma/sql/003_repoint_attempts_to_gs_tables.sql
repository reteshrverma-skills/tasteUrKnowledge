-- Repoints quiz history at the new English tables:
--   Attempt.dayId      -> Attempt.gsEngCompId      (gsEnglishComp)
--   Answer.questionId  -> Answer.gsEngQuestionId   (gsEnglishQuestions)
--
-- The old ids are rebuilt by matching on the values 002 copied across:
--   Day      <-> gsEnglishComp      on (yearName, subjectName, label)
--   Question <-> gsEnglishQuestions on (comprehension, question text)
-- Both matches were verified 1:1 before this migration was written.
--
-- Day and Question are left in place; they are simply no longer referenced.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/003_repoint_attempts_to_gs_tables.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Attempt -> gsEnglishComp
-- ---------------------------------------------------------------------------
ALTER TABLE "Attempt" ADD COLUMN "gsEngCompId" INTEGER;

UPDATE "Attempt" a
SET "gsEngCompId" = c."id"
FROM "Day" d
JOIN "Subject" s       ON s."id" = d."subjectId"
JOIN "Year" y          ON y."id" = s."yearId"
JOIN "gsEnglishComp" c ON c."yearName"    = y."name"
                      AND c."subjectName" = s."name"
                      AND c."label"       = d."label"
WHERE d."id" = a."dayId";

DO $$
DECLARE unmapped INTEGER;
BEGIN
  SELECT count(*) INTO unmapped FROM "Attempt" WHERE "gsEngCompId" IS NULL;
  IF unmapped > 0 THEN
    RAISE EXCEPTION '% attempt(s) have no matching comprehension - aborting', unmapped;
  END IF;
END $$;

ALTER TABLE "Attempt" DROP CONSTRAINT IF EXISTS "Attempt_dayId_fkey";
ALTER TABLE "Attempt" DROP COLUMN "dayId";
ALTER TABLE "Attempt" ALTER COLUMN "gsEngCompId" SET NOT NULL;
ALTER TABLE "Attempt"
  ADD CONSTRAINT "Attempt_gsEngCompId_fkey" FOREIGN KEY ("gsEngCompId")
  REFERENCES "gsEnglishComp"("id") ON UPDATE CASCADE ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "Attempt_gsEngCompId_idx" ON "Attempt" ("gsEngCompId");

-- ---------------------------------------------------------------------------
-- 2. Answer -> gsEnglishQuestions
-- ---------------------------------------------------------------------------
ALTER TABLE "Answer" ADD COLUMN "gsEngQuestionId" INTEGER;

UPDATE "Answer" ans
SET "gsEngQuestionId" = g."id"
FROM "Question" q
JOIN "Day" d                ON d."id" = q."dayId"
JOIN "Subject" s            ON s."id" = d."subjectId"
JOIN "Year" y               ON y."id" = s."yearId"
JOIN "gsEnglishComp" c      ON c."yearName"    = y."name"
                           AND c."subjectName" = s."name"
                           AND c."label"       = d."label"
JOIN "gsEnglishQuestions" g ON g."gsEngCompId" = c."id"
                           AND g."quest"       = q."text"
WHERE q."id" = ans."questionId";

DO $$
DECLARE unmapped INTEGER;
BEGIN
  SELECT count(*) INTO unmapped FROM "Answer" WHERE "gsEngQuestionId" IS NULL;
  IF unmapped > 0 THEN
    RAISE EXCEPTION '% answer(s) have no matching question - aborting', unmapped;
  END IF;
END $$;

ALTER TABLE "Answer" DROP CONSTRAINT IF EXISTS "Answer_questionId_fkey";
ALTER TABLE "Answer" DROP COLUMN "questionId";
ALTER TABLE "Answer" ALTER COLUMN "gsEngQuestionId" SET NOT NULL;
ALTER TABLE "Answer"
  ADD CONSTRAINT "Answer_gsEngQuestionId_fkey" FOREIGN KEY ("gsEngQuestionId")
  REFERENCES "gsEnglishQuestions"("id") ON UPDATE CASCADE ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "Answer_gsEngQuestionId_idx" ON "Answer" ("gsEngQuestionId");

COMMIT;
