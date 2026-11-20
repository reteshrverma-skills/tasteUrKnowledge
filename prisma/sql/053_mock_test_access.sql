-- Mock test access: which students may sit which mock paper.
--
-- For now an admin grants access student by student (or all at once) on
-- /admin/mock-tests/access. A student sees and sits an approved paper only
-- while they hold an active grant for it. Later, subscriptions can write
-- grants here too.
--
-- One row per paper and student. Removing access sets revokedAt instead of
-- deleting the row, so there is a history; granting again clears revokedAt.
--
-- Additive only: a new table, no existing row is changed. Running it again
-- does nothing.
--
-- Run this BEFORE deploying the matching schema.prisma.
--
-- Run once:  npx prisma db execute --file prisma/sql/053_mock_test_access.sql --schema prisma/schema.prisma

BEGIN;

CREATE TABLE IF NOT EXISTS public."mockTestAccess" (
    "id"         BIGSERIAL      PRIMARY KEY,
    "testId"     BIGINT         NOT NULL REFERENCES public."mockTestGs" ("id") ON DELETE RESTRICT,
    "studentId"  BIGINT         NOT NULL REFERENCES public."userProfile" ("id") ON DELETE CASCADE,
    "grantedAt"  TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    -- The admin who last granted it; kept if that account goes.
    "grantedBy"  BIGINT         REFERENCES public."userProfile" ("id") ON DELETE SET NULL,
    -- Null while the student has access.
    "revokedAt"  TIMESTAMPTZ(3),
    "revokedBy"  BIGINT         REFERENCES public."userProfile" ("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "mockTestAccess_testId_studentId_key"
    ON public."mockTestAccess" ("testId", "studentId");
CREATE INDEX IF NOT EXISTS "mockTestAccess_studentId_idx"
    ON public."mockTestAccess" ("studentId");

COMMIT;
