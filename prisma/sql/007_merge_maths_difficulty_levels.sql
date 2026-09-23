-- Aligns Maths onto the same difficulty ladder as English:
--   Starter -> Explorer -> Challenger -> Master
--
--   Getting Started -> Starter
--   Practice        -> Explorer
--   Think Harder    -> Challenger   )  merged
--   Challenge       -> Challenger   )
--   Starter / Explorer / Challenger / Master pass through unchanged.
--
-- Written to be idempotent and to tolerate a part-renamed table, since some
-- rows were already carrying the new names when this was first run.
--
-- The Think Harder / Challenge merge is lossy - afterwards the two cannot be
-- told apart. To reverse, restore the backup taken before this ran.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/007_merge_maths_difficulty_levels.sql

BEGIN;

-- Refuse to touch anything if a level turns up that this mapping does not know
-- about, rather than silently leaving it behind.
DO $$
DECLARE unexpected TEXT;
BEGIN
  SELECT string_agg(DISTINCT "difficultyLevel", ', ') INTO unexpected
    FROM "gsMathsQuestions"
   WHERE "difficultyLevel" IS NOT NULL
     AND "difficultyLevel" NOT IN (
           'Getting Started', 'Practice', 'Think Harder', 'Challenge',
           'Starter', 'Explorer', 'Challenger', 'Master'
         );

  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'Unexpected difficulty level(s): % - aborting', unexpected;
  END IF;
END $$;

UPDATE "gsMathsQuestions"
   SET "difficultyLevel" = CASE "difficultyLevel"
         WHEN 'Getting Started' THEN 'Starter'
         WHEN 'Practice'        THEN 'Explorer'
         WHEN 'Think Harder'    THEN 'Challenger'
         WHEN 'Challenge'       THEN 'Challenger'
         ELSE "difficultyLevel"
       END
 WHERE "difficultyLevel" IN
       ('Getting Started', 'Practice', 'Think Harder', 'Challenge');

-- Verify nothing is left outside the four-rung ladder.
DO $$
DECLARE stragglers TEXT;
BEGIN
  SELECT string_agg(DISTINCT "difficultyLevel", ', ') INTO stragglers
    FROM "gsMathsQuestions"
   WHERE "difficultyLevel" IS NOT NULL
     AND "difficultyLevel" NOT IN
         ('Starter', 'Explorer', 'Challenger', 'Master');

  IF stragglers IS NOT NULL THEN
    RAISE EXCEPTION 'Levels left outside the ladder: % - aborting', stragglers;
  END IF;
END $$;

COMMIT;
