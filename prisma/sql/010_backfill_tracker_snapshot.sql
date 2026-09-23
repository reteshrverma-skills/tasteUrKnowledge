-- Backfills the snapshot columns added in 009 for rounds recorded before it.
--
-- Those rounds have topic / subTopic / difficultyLevel NULL, which the picker
-- reads to decide which cell a result belongs to - so without this they would
-- silently stop appearing in "last 3 results".
--
-- The values are derived the old way, from the questions that were served:
--   * difficultyLevel and topic come from the questions (uniform within a round)
--   * subTopic is set only when every question shares one, which is exactly
--     what distinguishes a subtopic round from a whole-topic test
--
-- Only fills NULLs; never overwrites a snapshot that is already there, and
-- never removes a row. Safe to re-run.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/010_backfill_tracker_snapshot.sql

BEGIN;

WITH derived AS (
  SELECT
    m."id" AS test_id,
    -- Uniform within a round, so min() just picks that single value.
    min(q."topic")           AS topic,
    min(q."difficultyLevel") AS difficulty_level,
    CASE
      WHEN count(DISTINCT q."subTopic") = 1 THEN min(q."subTopic")
      ELSE NULL                       -- spans subtopics: a whole-topic test
    END AS sub_topic
  FROM "testTrackerMathMain" m
  JOIN "testTrackerMath" t ON t."testId" = m."id"
  JOIN "gsMathsQuestions" q ON q."id" = t."questionId"
  WHERE m."difficultyLevel" IS NULL
  GROUP BY m."id"
)
UPDATE "testTrackerMathMain" m
   SET "topic"           = COALESCE(m."topic", d.topic),
       "subTopic"        = COALESCE(m."subTopic", d.sub_topic),
       "difficultyLevel" = COALESCE(m."difficultyLevel", d.difficulty_level)
  FROM derived d
 WHERE d.test_id = m."id";

-- Report anything still unresolved (a round with no question rows).
DO $$
DECLARE remaining INTEGER;
BEGIN
  SELECT count(*) INTO remaining
    FROM "testTrackerMathMain" WHERE "difficultyLevel" IS NULL;
  IF remaining > 0 THEN
    RAISE NOTICE '% round(s) left without a snapshot (no question rows to derive from)', remaining;
  END IF;
END $$;

COMMIT;
