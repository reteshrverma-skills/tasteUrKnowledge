-- schoolClassTeacher -> coreSchoolClassTeacher, in line with the other core
-- tables (039). Its constraints, indexes and sequence are renamed with it.
-- Prisma: model SchoolClassTeacher keeps its name; @@map and its index map
-- names change. No data changes; running it again does nothing.
--
-- Deploy the matching schema.prisma at the same time.
--
-- Run once:  npx prisma db execute --file prisma/sql/041_core_school_class_teacher.sql --schema prisma/schema.prisma

BEGIN;

DO $$
DECLARE
    r record;
BEGIN
    IF to_regclass('public."schoolClassTeacher"') IS NULL THEN
        RETURN;
    END IF;

    ALTER TABLE public."schoolClassTeacher" RENAME TO "coreSchoolClassTeacher";

    FOR r IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public."coreSchoolClassTeacher"'::regclass
          AND conname LIKE 'schoolClassTeacher\_%'
    LOOP
        EXECUTE format(
            'ALTER TABLE public."coreSchoolClassTeacher" RENAME CONSTRAINT %I TO %I',
            r.conname, 'coreS' || substr(r.conname, 2)
        );
    END LOOP;
    FOR r IN
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'coreSchoolClassTeacher'
          AND indexname LIKE 'schoolClassTeacher\_%'
    LOOP
        EXECUTE format('ALTER INDEX public.%I RENAME TO %I', r.indexname, 'coreS' || substr(r.indexname, 2));
    END LOOP;
    ALTER SEQUENCE IF EXISTS public."schoolClassTeacher_id_seq"
        RENAME TO "coreSchoolClassTeacher_id_seq";
END $$;

COMMIT;
