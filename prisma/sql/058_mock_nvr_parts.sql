-- Mock tests: Non-Verbal Reasoning is sat in 3 parts of 8 questions, 4 minutes each.
--
-- Before: one NON_VERBAL section per set (20 questions).
-- After:  three NON_VERBAL sections per set - part 1, 2 and 3 - each with
--         8 questions and its own 4-minute clock. Questions keep their
--         numbers 1-24 across the subject; part = (questionOrder - 1) / 8 + 1.
--
--   mockTestGsSection.part   1 for every subject; 1-3 for NON_VERBAL.
--                            Unique key becomes (testId, setNo, subject, part).
--   mockTestGsQuestion.part  which part the question is sat in; the
--                            question -> section foreign key now includes it.
--
-- Existing papers: the NON_VERBAL section becomes part 1 (4 minutes) and
-- parts 2 and 3 are added after it (sectionOrder 5 and 6, 4 minutes each).
-- Existing questions 9-16 move to part 2 and 17-24 to part 3. Each set then
-- needs 24 Non-Verbal questions; 059 adds the missing 21-24 to Mock Test 1.
--
-- Sittings that already happened are not touched: their section attempts,
-- answers and marks stay exactly as they were.
--
-- No row is deleted. Running it again does nothing.
-- Run this BEFORE deploying the matching schema.prisma.
--
-- Run once:  npx prisma db execute --file prisma/sql/058_mock_nvr_parts.sql --schema prisma/schema.prisma

BEGIN;

ALTER TABLE public."mockTestGsSection"  ADD COLUMN IF NOT EXISTS "part" SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE public."mockTestGsQuestion" ADD COLUMN IF NOT EXISTS "part" SMALLINT NOT NULL DEFAULT 1;

-- The question -> section key changes shape, so drop it while the data moves.
ALTER TABLE public."mockTestGsQuestion" DROP CONSTRAINT IF EXISTS "mockTestGsQuestion_section_fkey";
DROP INDEX IF EXISTS public."mockTestGsSection_testId_setNo_subject_key";
CREATE UNIQUE INDEX IF NOT EXISTS "mockTestGsSection_testId_setNo_subject_part_key"
    ON public."mockTestGsSection" ("testId", "setNo", "subject", "part");

-- Existing Non-Verbal sections become part 1 of 3, at 4 minutes each.
UPDATE public."mockTestGsSection"
   SET "durationMinutes" = 4
 WHERE "subject" = 'NON_VERBAL' AND "part" = 1 AND "durationMinutes" <> 4
   AND NOT EXISTS (SELECT 1 FROM public."mockTestGsSection" p2
                    WHERE p2."testId" = "mockTestGsSection"."testId"
                      AND p2."setNo" = "mockTestGsSection"."setNo"
                      AND p2."subject" = 'NON_VERBAL' AND p2."part" = 2);

INSERT INTO public."mockTestGsSection" ("testId", "setNo", "subject", "part", "sectionOrder", "durationMinutes")
SELECT s."testId", s."setNo", 'NON_VERBAL', p.part, s."sectionOrder" + p.part - 1, 4
  FROM public."mockTestGsSection" s
 CROSS JOIN (VALUES (2), (3)) AS p(part)
 WHERE s."subject" = 'NON_VERBAL' AND s."part" = 1
ON CONFLICT ("testId", "setNo", "subject", "part") DO NOTHING;

-- Non-Verbal questions move into their part.
UPDATE public."mockTestGsQuestion"
   SET "part" = ("questionOrder" - 1) / 8 + 1
 WHERE "subject" = 'NON_VERBAL' AND "part" <> ("questionOrder" - 1) / 8 + 1;

ALTER TABLE public."mockTestGsQuestion"
    ADD CONSTRAINT "mockTestGsQuestion_section_fkey"
    FOREIGN KEY ("testId", "setNo", "subject", "part")
    REFERENCES public."mockTestGsSection" ("testId", "setNo", "subject", "part") ON DELETE CASCADE;

DO $do$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mockTestGsSection_part_check') THEN
        ALTER TABLE public."mockTestGsSection" ADD CONSTRAINT "mockTestGsSection_part_check"
            CHECK ("part" = 1 OR ("subject" = 'NON_VERBAL' AND "part" BETWEEN 1 AND 3));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mockTestGsQuestion_part_check') THEN
        ALTER TABLE public."mockTestGsQuestion" ADD CONSTRAINT "mockTestGsQuestion_part_check"
            CHECK (CASE WHEN "subject" = 'NON_VERBAL'
                        THEN "part" = ("questionOrder" - 1) / 8 + 1 AND "questionOrder" BETWEEN 1 AND 24
                        ELSE "part" = 1 END);
    END IF;
END
$do$;

COMMIT;

-- Check:
-- SELECT "testId", "setNo", "subject", "part", "sectionOrder", "durationMinutes"
--   FROM public."mockTestGsSection" ORDER BY 1, 2, 5;
-- SELECT "testId", "setNo", "part", count(*) FROM public."mockTestGsQuestion"
--  WHERE "subject" = 'NON_VERBAL' GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
