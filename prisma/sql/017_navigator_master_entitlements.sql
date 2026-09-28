-- Adds the two rungs the ladder gained.
--
-- The ladder is now:
--
--     Starter  ->  Explorer  ->  Navigator  ->  Challenger  ->  Master
--
-- Navigator is new, and Master had a name in the sort order but never had a
-- column behind it, so neither could be granted to anybody. A level with no
-- column is invisible: allowedLevels() builds the permitted list from these
-- booleans, so "Navigator" never appeared in it and the 550 Navigator
-- questions were filtered out of every student's view.
--
-- "Think Harder" leaves the ladder but its column stays exactly where it is.
-- No content carries that level any more, nothing reads the column, and
-- dropping it would throw away a record of what had been granted.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/017_navigator_master_entitlements.sql

BEGIN;

ALTER TABLE "userStudentDetails"
  ADD COLUMN IF NOT EXISTS "navigator" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "master"    BOOLEAN DEFAULT FALSE;

-- ---------------------------------------------------------------------------
-- Anyone already trusted with Challenger is trusted with Navigator, which now
-- sits below it. Without this every child would be locked out of the new rung
-- until each one was granted by hand, which is not what granting the harder
-- level meant.
--
-- Only fills NULL/false, so a deliberate revoke is never undone by a re-run.
-- Master is left alone: there is no higher rung to infer it from.
-- ---------------------------------------------------------------------------
UPDATE "userStudentDetails"
   SET "navigator" = TRUE
 WHERE "challenger" IS TRUE
   AND "navigator" IS DISTINCT FROM TRUE;

DO $$
DECLARE granted INTEGER;
BEGIN
  SELECT count(*) INTO granted
    FROM "userStudentDetails" WHERE "navigator" IS TRUE;
  RAISE NOTICE '% child profile(s) can now open Navigator', granted;
END $$;

COMMIT;
