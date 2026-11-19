-- The subjects a GCSE / A-Level student studies and the awarding organisation
-- (exam board) for each, chosen on their My Profile page.
--
--   * subjectCode / boardCode are codes from src/config/senior-subjects.json,
--     not foreign keys - the list lives in the config.
--   * One row per student, programme and subject. Taking a subject off sets
--     isSelected = false; the app never deletes rows.
--
-- Additive only: one new table. No existing row is changed. Running it again
-- does nothing.
--
-- Run this BEFORE deploying the matching schema.prisma.
--
-- Run once:  npx prisma db execute --file prisma/sql/046_student_subject.sql --schema prisma/schema.prisma

CREATE TABLE IF NOT EXISTS public."studentSubject" (
    "id"            BIGSERIAL    PRIMARY KEY,
    "studentId"     BIGINT       NOT NULL REFERENCES public."userProfile" ("id") ON DELETE CASCADE,
    "programmeCode" TEXT         NOT NULL REFERENCES public."coreProgramme" ("code") ON UPDATE CASCADE ON DELETE RESTRICT,
    "subjectCode"   TEXT         NOT NULL,
    "boardCode"     TEXT         NOT NULL,
    "isSelected"    BOOLEAN      NOT NULL DEFAULT TRUE,
    "createdAt"     TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    "updatedAt"     TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    CONSTRAINT "studentSubject_codes_format"
        CHECK ("subjectCode" ~ '^[A-Z0-9_]{2,30}$' AND "boardCode" ~ '^[A-Z0-9_]{2,30}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS "studentSubject_studentId_programmeCode_subjectCode_key"
    ON public."studentSubject" ("studentId", "programmeCode", "subjectCode");
