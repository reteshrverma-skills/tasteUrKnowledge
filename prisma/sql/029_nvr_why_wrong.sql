-- Why each wrong Non-Verbal option is wrong, shown on the answer sheet when a
-- child picked that option - the same columns gsVRQuestions already has.
-- Prisma: GsNvrQuestion.whyWrongA .. whyWrongE
--
-- Additive and nullable: existing questions simply show no note until these
-- are filled in. Safe to run more than once.
--
-- Run once:  npx prisma db execute --file prisma/sql/029_nvr_why_wrong.sql --schema prisma/schema.prisma

ALTER TABLE public."gsNvrQuestions"
    ADD COLUMN IF NOT EXISTS "whyWrongA" TEXT,
    ADD COLUMN IF NOT EXISTS "whyWrongB" TEXT,
    ADD COLUMN IF NOT EXISTS "whyWrongC" TEXT,
    ADD COLUMN IF NOT EXISTS "whyWrongD" TEXT,
    ADD COLUMN IF NOT EXISTS "whyWrongE" TEXT;
