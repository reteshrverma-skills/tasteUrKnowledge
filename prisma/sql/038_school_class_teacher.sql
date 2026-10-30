-- The teacher-to-class link becomes schoolClassTeacher, with classId pointing
-- at masterSchoolClass (migration 037): schoolYearTeacher (yearId) is
-- renamed in place and its rows are kept.
--
-- An early draft of 036 left a schoolClassTeacher table of its own, which
-- holds the name; it is dropped first, and only when empty - if it holds a
-- row this stops with an error and changes nothing. The other early-draft
-- leftovers (schoolClass, userStudentDetails.schoolClassId) are dropped by
-- the pre-launch cleanup, 040.
-- Prisma: SchoolClassTeacher (classId); SchoolYearTeacher is gone.
--
-- Deploy the matching schema.prisma at the same time.
--
-- Run once:  npx prisma db execute --file prisma/sql/038_school_class_teacher.sql --schema prisma/schema.prisma

BEGIN;

DO $$
DECLARE
    r record;
BEGIN
    -- Already done: nothing to do.
    IF to_regclass('public."schoolYearTeacher"') IS NULL THEN
        RETURN;
    END IF;

    -- The early-draft schoolClassTeacher: refuse to drop it if it holds rows.
    IF to_regclass('public."schoolClassTeacher"') IS NOT NULL
       AND EXISTS (SELECT 1 FROM public."schoolClassTeacher") THEN
        RAISE EXCEPTION 'schoolClassTeacher (early draft) has rows - not dropping it';
    END IF;
    DROP TABLE IF EXISTS public."schoolClassTeacher";

    -- schoolYearTeacher -> schoolClassTeacher, yearId -> classId.
    ALTER TABLE public."schoolYearTeacher" RENAME TO "schoolClassTeacher";
    ALTER TABLE public."schoolClassTeacher" RENAME COLUMN "yearId" TO "classId";

    -- Every constraint, index and sequence named after the old table and
    -- column (keys, foreign keys, the NOT NULLs Postgres 18 names) follows.
    -- Renaming the primary key constraint renames its index with it.
    FOR r IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public."schoolClassTeacher"'::regclass
          AND conname LIKE 'schoolYearTeacher\_%'
    LOOP
        EXECUTE format(
            'ALTER TABLE public."schoolClassTeacher" RENAME CONSTRAINT %I TO %I',
            r.conname,
            replace(replace(r.conname, 'schoolYearTeacher', 'schoolClassTeacher'), 'yearId', 'classId')
        );
    END LOOP;
    FOR r IN
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'schoolClassTeacher'
          AND indexname LIKE 'schoolYearTeacher\_%'
    LOOP
        EXECUTE format(
            'ALTER INDEX public.%I RENAME TO %I',
            r.indexname,
            replace(replace(r.indexname, 'schoolYearTeacher', 'schoolClassTeacher'), 'yearId', 'classId')
        );
    END LOOP;
    ALTER SEQUENCE IF EXISTS public."schoolYearTeacher_id_seq"
        RENAME TO "schoolClassTeacher_id_seq";
END $$;

COMMIT;
