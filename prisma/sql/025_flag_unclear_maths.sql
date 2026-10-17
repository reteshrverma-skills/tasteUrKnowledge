-- "Answer not clear? Report it" on the Maths answer sheet, as 023 added for
-- Non-Verbal and Verbal Reasoning.
-- Prisma: TestTrackerMath.flaggedUnclear / .flaggedUnclearAt
--
-- Clearing it is an UPDATE back to FALSE; nothing is deleted.
--
-- Run once:  npx prisma db execute --file prisma/sql/025_flag_unclear_maths.sql --schema prisma/schema.prisma

ALTER TABLE public."testTrackerMath"
    ADD COLUMN IF NOT EXISTS "flaggedUnclear" BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "flaggedUnclearAt" TIMESTAMPTZ(3);

-- Admins look these up by flag, so keep that cheap as the table grows.
CREATE INDEX IF NOT EXISTS "testTrackerMath_flaggedUnclear_idx"
    ON public."testTrackerMath" ("questionId") WHERE "flaggedUnclear";
