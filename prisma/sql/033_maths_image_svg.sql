-- A diagram for a Maths question (shapes, graphs, number lines...), as inline
-- SVG shown above the options in the quiz and on the answer sheet.
-- Prisma: GsMathsQuestion.imageSvg
--
-- The SVG becomes live markup in a child's browser, so the database refuses
-- anything executable - the same rule gsNvrQuestions has (migration 018) - and
-- the app strips what survives before rendering. Null means no diagram.
--
-- Safe to run more than once.
--
-- Run once:  npx prisma db execute --file prisma/sql/033_maths_image_svg.sql --schema prisma/schema.prisma

BEGIN;

ALTER TABLE public."gsMathsQuestions"
    ADD COLUMN IF NOT EXISTS "imageSvg" TEXT;

-- \m anchors to the start of a word, so "on" must begin an attribute name:
-- onclick, onerror and the rest are caught, "polygon points=" is not.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'maths_image_no_markup'
    ) THEN
        ALTER TABLE public."gsMathsQuestions"
            ADD CONSTRAINT maths_image_no_markup CHECK (
                coalesce("imageSvg", '')
                !~* '<script|<foreignObject|<use\M|<animate|<set\M|javascript:|\mon[a-z]+\s*='
            );
    END IF;
END $$;

COMMIT;
