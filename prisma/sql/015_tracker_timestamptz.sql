-- Makes the tracker timestamps time zone aware.
--
-- testStartTime is TIMESTAMP WITHOUT TIME ZONE. Prisma writes UTC into it,
-- while this database runs with TimeZone = Europe/London, so the stored value
-- is UTC but every comparison against now() or CURRENT_DATE reads it as local
-- time. In summer that is a one hour error, which was harmless while nothing
-- grouped by date - and is not harmless now that the parent dashboard reports
-- "today", "this week" and "this month". A round finished at 23:30 UTC belongs
-- to the next day in London, and only a tz-aware column gets that right.
--
-- The USING clause tags each existing value as the UTC it already was, so no
-- reading moves in real terms; only the type changes. Purely a type change:
-- no row is added, altered in meaning, or removed.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/015_tracker_timestamptz.sql

BEGIN;

ALTER TABLE "testTrackerMathMain"
  ALTER COLUMN "testStartTime" TYPE TIMESTAMPTZ(3)
    USING "testStartTime" AT TIME ZONE 'UTC',
  ALTER COLUMN "testStartTime" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "testTrackerEnglishMain"
  ALTER COLUMN "testStartTime" TYPE TIMESTAMPTZ(3)
    USING "testStartTime" AT TIME ZONE 'UTC',
  ALTER COLUMN "testStartTime" SET DEFAULT CURRENT_TIMESTAMP;

COMMIT;
