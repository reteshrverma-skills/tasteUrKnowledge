-- Carries the English history already recorded in Attempt / Answer into the
-- new tracker tables, so the parent view starts with the past in it.
--
-- Migration 010 was written because switching a read to new columns would have
-- hidden three rounds a child had really sat. Same risk here, larger: 13
-- attempts and 63 answers predate the tracker.
--
-- Insert-only. Nothing is updated, nothing is removed, and legacyAttemptId
-- carries the source Attempt.id so re-running imports nothing twice.
--
-- What cannot be recovered, and stays NULL rather than being invented:
--   * timeSpentOnQuestion and passageReadSeconds - never measured
--   * completionReason - unknown, though all of these were hand-submitted
--
-- What is taken as it stands today rather than as it was then: the
-- comprehension's difficulty / year and each question's answer key. Those are
-- the only values available; from here on they are snapshotted at submission.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/012_backfill_english_tracker.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. One tracker test per legacy attempt
-- ---------------------------------------------------------------------------
INSERT INTO "testTrackerEnglishMain" (
  "studentId", "testStartTime", "gsEngCompId",
  "topic", "difficultyLevel", "yearName", "legacyAttemptId"
)
SELECT
  a."userId",
  a."submittedAt",
  a."gsEngCompId",
  c."label",
  c."difficultyLevel",
  c."yearName",
  a."id"
FROM "Attempt" a
JOIN "gsEnglishComp" c ON c."id" = a."gsEngCompId"
WHERE NOT EXISTS (
  SELECT 1 FROM "testTrackerEnglishMain" m WHERE m."legacyAttemptId" = a."id"
);

-- ---------------------------------------------------------------------------
-- 2. One tracker row per legacy answer
--
-- questionOrder is derived by question id, which is the order the quiz screen
-- has always presented them in (orderBy: { id: "asc" }).
-- ---------------------------------------------------------------------------
INSERT INTO "testTrackerEnglish" (
  "testId", "questionId", "studentId",
  "isAnsRight", "isSkipped", "chosenOption", "correctOption",
  "questionOrder", "topic"
)
SELECT
  m."id",
  ans."gsEngQuestionId",
  m."studentId",
  ans."isCorrect",
  ans."chosenOption" IS NULL,
  ans."chosenOption",
  q."ansChoice",
  row_number() OVER (
    PARTITION BY ans."attemptId" ORDER BY ans."gsEngQuestionId"
  )::SMALLINT,
  q."topic"
FROM "Answer" ans
JOIN "testTrackerEnglishMain" m ON m."legacyAttemptId" = ans."attemptId"
JOIN "gsEnglishQuestions" q ON q."id" = ans."gsEngQuestionId"
WHERE NOT EXISTS (
  SELECT 1 FROM "testTrackerEnglish" t
   WHERE t."testId" = m."id" AND t."questionId" = ans."gsEngQuestionId"
);

-- ---------------------------------------------------------------------------
-- 3. Report what landed
-- ---------------------------------------------------------------------------
DO $$
DECLARE imported INTEGER; rows_imported INTEGER; orphaned INTEGER;
BEGIN
  SELECT count(*) INTO imported
    FROM "testTrackerEnglishMain" WHERE "legacyAttemptId" IS NOT NULL;
  SELECT count(*) INTO rows_imported
    FROM "testTrackerEnglish" t
    JOIN "testTrackerEnglishMain" m ON m."id" = t."testId"
   WHERE m."legacyAttemptId" IS NOT NULL;
  SELECT count(*) INTO orphaned
    FROM "Attempt" a
   WHERE NOT EXISTS (SELECT 1 FROM "testTrackerEnglishMain" m
                      WHERE m."legacyAttemptId" = a."id");

  RAISE NOTICE 'English tracker holds % imported test(s), % answer row(s)',
    imported, rows_imported;
  IF orphaned > 0 THEN
    RAISE NOTICE '% legacy attempt(s) could not be imported (comprehension gone)',
      orphaned;
  END IF;
END $$;

COMMIT;
