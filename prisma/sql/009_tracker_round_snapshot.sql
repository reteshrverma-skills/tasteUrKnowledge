-- Records what a practice round actually was, on the round itself.
--
-- Purely additive: three nullable columns, no existing column or row altered.
--
-- Why this is needed rather than derived:
--   * A topic-level test draws across many subtopics; a subtopic test draws
--     from one. Without a snapshot the only way to tell them apart is to count
--     the distinct subtopics of the questions served, which misreads a topic
--     test that happens to draw narrowly.
--   * difficultyLevel has already been re-tagged twice (Think Harder ->
--     Challenger). Deriving a past round's level from its questions means every
--     re-tag silently moves historical results between buckets.
--
--   subTopic IS NULL marks a topic-level test spanning several subtopics.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/009_tracker_round_snapshot.sql

BEGIN;

ALTER TABLE "testTrackerMathMain"
  ADD COLUMN IF NOT EXISTS "topic"           TEXT,
  ADD COLUMN IF NOT EXISTS "subTopic"        TEXT,
  ADD COLUMN IF NOT EXISTS "difficultyLevel" TEXT;

-- Serves the picker's "last 3 results for this cell" lookup.
CREATE INDEX IF NOT EXISTS "testTrackerMathMain_student_round_idx"
  ON "testTrackerMathMain"
     ("studentId", "topic", "subTopic", "difficultyLevel", "testStartTime");

COMMIT;
