-- Programmes: Grammar School (11+), GCSE and A-Level share one database, and
-- every child and every piece of content belongs to exactly one of them.
-- Prisma: Programme, and programmeCode on UserProfile and the four banks.
--
-- programme: the list. Only GRAMMAR is active for now; GCSE and ALEVEL are
-- here ready, inactive (not offered when adding a child) until their content
-- is loaded - flip isActive then.
--
-- programmeCode columns: NOT NULL DEFAULT 'GRAMMAR'. Every existing child and
-- question is 11+ material, so the default labels them all correctly, and SQL
-- loaders that do not mention the column keep producing 11+ rows.
--
-- Indexes: new ones lead with programmeCode, because every student query now
-- filters on it first. The old indexes stay until these are proven in use.
--
-- Safe to run more than once.
--
-- Run once:  npx prisma db execute --file prisma/sql/032_programme.sql --schema prisma/schema.prisma

BEGIN;

CREATE TABLE IF NOT EXISTS public."programme" (
    "code"      TEXT     PRIMARY KEY,
    "name"      TEXT     NOT NULL,
    "sortOrder" SMALLINT NOT NULL DEFAULT 100,
    "isActive"  BOOLEAN  NOT NULL DEFAULT TRUE,
    CONSTRAINT programme_code_format CHECK ("code" ~ '^[A-Z]{2,20}$')
);

INSERT INTO public."programme" ("code", "name", "sortOrder", "isActive") VALUES
    ('GRAMMAR', 'Grammar School (11+)', 1, TRUE),
    ('GCSE',    'GCSE',                 2, FALSE),
    ('ALEVEL',  'A-Level',              3, FALSE)
ON CONFLICT ("code") DO NOTHING;

-- One column per table, each with the same default and foreign key.
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'userProfile', 'gsEnglishComp', 'gsMathsQuestions',
        'gsNvrQuestions', 'gsVRQuestions'
    ]
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "programmeCode" TEXT NOT NULL DEFAULT %L',
            t, 'GRAMMAR'
        );
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = t || '_programmeCode_fkey'
        ) THEN
            EXECUTE format(
                'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY ("programmeCode") REFERENCES public."programme" ("code") ON UPDATE CASCADE ON DELETE RESTRICT',
                t, t || '_programmeCode_fkey'
            );
        END IF;
    END LOOP;
END $$;

-- Indexes led by programme, matching what the student pages filter on.
CREATE INDEX IF NOT EXISTS "userProfile_programmeCode_idx"
    ON public."userProfile" ("programmeCode");
CREATE INDEX IF NOT EXISTS "gsEnglishComp_programme_subject_level_idx"
    ON public."gsEnglishComp" ("programmeCode", "subjectName", "difficultyLevel");
CREATE INDEX IF NOT EXISTS "gsMathsQuestions_programme_subTopic_level_idx"
    ON public."gsMathsQuestions" ("programmeCode", "subTopic", "difficultyLevel");
CREATE INDEX IF NOT EXISTS "gsMathsQuestions_programme_topic_level_idx"
    ON public."gsMathsQuestions" ("programmeCode", "topic", "difficultyLevel");
CREATE INDEX IF NOT EXISTS "gsNvrQuestions_programme_topic_level_idx"
    ON public."gsNvrQuestions" ("programmeCode", "topic", "difficultyLevel");
CREATE INDEX IF NOT EXISTS "gsNvrQuestions_programme_subTopic_level_idx"
    ON public."gsNvrQuestions" ("programmeCode", "subTopic", "difficultyLevel");
CREATE INDEX IF NOT EXISTS "gsVRQuestions_programme_topic_level_idx"
    ON public."gsVRQuestions" ("programmeCode", "topic", "subTopic", "difficultyLevel");

COMMIT;
