-- Prepares gsMathsQuestions for use by the app.
--
-- The columns arrive as VARCHAR(255); questions and explanations already run to
-- 166 and 137 characters, so they are widened to TEXT before a longer one is
-- written and silently rejected. Indexes back the subtopic/difficulty picker.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/006_maths_questions.sql

BEGIN;

ALTER TABLE "gsMathsQuestions"
  ALTER COLUMN "topic"           TYPE TEXT,
  ALTER COLUMN "subTopic"        TYPE TEXT,
  ALTER COLUMN "quest"           TYPE TEXT,
  ALTER COLUMN "optionA"         TYPE TEXT,
  ALTER COLUMN "optionB"         TYPE TEXT,
  ALTER COLUMN "optionC"         TYPE TEXT,
  ALTER COLUMN "optionD"         TYPE TEXT,
  ALTER COLUMN "optionE"         TYPE TEXT,
  ALTER COLUMN "ansChoice"       TYPE TEXT,
  ALTER COLUMN "difficultyLevel" TYPE TEXT,
  ALTER COLUMN "explanation"     TYPE TEXT;

-- The picker filters on these two together, then lists by subtopic.
CREATE INDEX IF NOT EXISTS "gsMathsQuestions_subTopic_difficultyLevel_idx"
  ON "gsMathsQuestions" ("subTopic", "difficultyLevel");

CREATE INDEX IF NOT EXISTS "gsMathsQuestions_topic_idx"
  ON "gsMathsQuestions" ("topic");

COMMIT;
