-- Lets a Non-Verbal question's options be plain text (letter codes such as
-- "FM", numbers, words) as well as figures. optionFormat now accepts 'text';
-- the quiz and answer sheet already display such options, large and centred.
-- Prisma: GsNvrQuestion.optionFormat
--
-- Only widens the constraint, so every existing row stays valid.
-- Safe to run more than once.
--
-- Run once:  npx prisma db execute --file prisma/sql/030_nvr_text_options.sql --schema prisma/schema.prisma

ALTER TABLE public."gsNvrQuestions"
    DROP CONSTRAINT IF EXISTS nvr_option_format;

ALTER TABLE public."gsNvrQuestions"
    ADD CONSTRAINT nvr_option_format
    CHECK ("optionFormat" IN ('svg', 'url', 'none', 'text'));
