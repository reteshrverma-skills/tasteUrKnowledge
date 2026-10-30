-- Reference tables get a "core" prefix, so they read apart from user data:
--   country           -> coreCountry
--   programme         -> coreProgramme
--   masterSchoolClass -> coreSchoolClass   (was "Year" before 037)
--   school            -> coreSchool
-- Prisma models keep their names (Country, Programme, Year, School); only
-- their @@map changes. Foreign keys pointing at these tables follow the
-- rename on their own; no data changes.
--
-- Each table's own constraints, indexes and sequence are renamed with it, so
-- the names match what Prisma expects ("coreSchool_pkey" and so on).
--
-- Deploy the matching schema.prisma and src/lib/admin-stats.ts (raw SQL that
-- joins "coreCountry") at the same time. Running it again does nothing.
--
-- Run once:  npx prisma db execute --file prisma/sql/039_core_tables.sql --schema prisma/schema.prisma

BEGIN;

DO $$
DECLARE
    pair   text[];
    old    text;
    new    text;
    r      record;
    renamed text;
BEGIN
    FOREACH pair SLICE 1 IN ARRAY ARRAY[
        ARRAY['country',           'coreCountry'],
        ARRAY['programme',         'coreProgramme'],
        ARRAY['masterSchoolClass', 'coreSchoolClass'],
        ARRAY['school',            'coreSchool']
    ]
    LOOP
        old := pair[1];
        new := pair[2];
        IF to_regclass(format('public.%I', old)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format('ALTER TABLE public.%I RENAME TO %I', old, new);

        -- Constraints named after the old table (or, for the class table,
        -- after "Year", which some NOT NULLs still carry from before 037).
        FOR r IN
            SELECT conname FROM pg_constraint
            WHERE conrelid = format('public.%I', new)::regclass
              AND (conname LIKE old || '\_%' OR conname LIKE 'Year\_%')
        LOOP
            renamed := new || substr(r.conname, length(split_part(r.conname, '_', 1)) + 1);
            EXECUTE format('ALTER TABLE public.%I RENAME CONSTRAINT %I TO %I', new, r.conname, renamed);
        END LOOP;

        FOR r IN
            SELECT indexname FROM pg_indexes
            WHERE schemaname = 'public' AND tablename = new
              AND (indexname LIKE old || '\_%' OR indexname LIKE 'Year\_%')
        LOOP
            renamed := new || substr(r.indexname, length(split_part(r.indexname, '_', 1)) + 1);
            EXECUTE format('ALTER INDEX public.%I RENAME TO %I', r.indexname, renamed);
        END LOOP;

        -- The id sequence, where the table has one (only school).
        IF to_regclass(format('public.%I', old || '_id_seq')) IS NOT NULL THEN
            EXECUTE format('ALTER SEQUENCE public.%I RENAME TO %I', old || '_id_seq', new || '_id_seq');
        END IF;
    END LOOP;
END $$;

COMMIT;
