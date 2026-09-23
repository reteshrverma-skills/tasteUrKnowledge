-- Brings the Maths tracker up to the same common core as the English one.
--
-- Purely additive: four nullable columns, no existing column or row altered.
--
-- The point of the pair-per-subject design is that the shared columns stay
-- identically named and typed, so one UNION view answers "which subject is
-- weakest" without per-subject special casing. Adding chosenOption,
-- correctOption, questionOrder and completionReason to English only would
-- break that on the day it shipped.
--
-- Existing rows keep NULL in all four; they were recorded before any of this
-- was captured, and a NULL says that honestly.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/013_align_maths_tracker_core.sql

BEGIN;

-- 'submitted' | 'timed_out' | 'abandoned'. Maths rounds run on a five minute
-- clock, so a low score that ran out of time is a different finding from a low
-- score that was handed in early.
ALTER TABLE "testTrackerMathMain"
  ADD COLUMN IF NOT EXISTS "completionReason" TEXT;

ALTER TABLE "testTrackerMath"
  ADD COLUMN IF NOT EXISTS "chosenOption"  VARCHAR(1),
  ADD COLUMN IF NOT EXISTS "correctOption" VARCHAR(1),
  ADD COLUMN IF NOT EXISTS "questionOrder" SMALLINT;

COMMIT;
