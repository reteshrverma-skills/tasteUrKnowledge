-- A student can mark a question on their answer sheet as "answer not clear",
-- so an admin can look at it. Non-Verbal and Verbal Reasoning only.
-- Prisma: TestTrackerNvr / TestTrackerVr .flaggedUnclear / .flaggedUnclearAt
--
-- The flag lives on the student's answer row, so it is tied to the round it
-- was raised from. Clearing it is an UPDATE back to FALSE; nothing is deleted.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/023_flag_unclear_answer.sql

ALTER TABLE public."testTrackerNvr"
    ADD COLUMN IF NOT EXISTS "flaggedUnclear" BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "flaggedUnclearAt" TIMESTAMPTZ(3);

ALTER TABLE public."testTrackerVR"
    ADD COLUMN IF NOT EXISTS "flaggedUnclear" BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "flaggedUnclearAt" TIMESTAMPTZ(3);

-- Admins look these up by flag, so keep that cheap as the tables grow.
CREATE INDEX IF NOT EXISTS "testTrackerNvr_flaggedUnclear_idx"
    ON public."testTrackerNvr" ("questionId") WHERE "flaggedUnclear";
CREATE INDEX IF NOT EXISTS "testTrackerVR_flaggedUnclear_idx"
    ON public."testTrackerVR" ("questionId") WHERE "flaggedUnclear";
