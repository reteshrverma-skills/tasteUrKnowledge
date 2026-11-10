-- Renames "difficultyLevel" (Starter, Explorer, Navigator, Challenger, Master)
-- to "stage" in every table that has it. A rename only: no data changes and
-- no row is touched or deleted. Postgres carries indexes and CHECK
-- constraints over to the new name. Running it again does nothing.
--
-- Run this AT THE SAME TIME as deploying the matching schema.prisma: the old
-- code reads "difficultyLevel" and the new code reads "stage".
--
-- Run once:  npx prisma db execute --file prisma/sql/043_rename_difficulty_level_to_stage.sql --schema prisma/schema.prisma

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'gsEnglishComp',
        'gsMathsQuestions',
        'gsNvrQuestions',
        'gsVRQuestions',
        'testTrackerEnglishMain',
        'testTrackerMathMain',
        'testTrackerNvrMain',
        'testTrackerVRMain'
    ]
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name = t
               AND column_name = 'difficultyLevel'
        ) THEN
            EXECUTE format('ALTER TABLE public.%I RENAME COLUMN "difficultyLevel" TO "stage"', t);
        END IF;
    END LOOP;
END $$;
