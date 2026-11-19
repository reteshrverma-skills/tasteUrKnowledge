-- Renames the subject code MATHS to Mathematics in studentSubject and
-- testLoadALevel, to match src/config/senior-subjects.json.
--
--   * studentSubject_codes_format only allowed upper-case codes, so it is
--     replaced with one that also allows lower case.
--   * UPDATE only; no row is deleted. Running it again does nothing.
--
-- Run once:  npx prisma db execute --file prisma/sql/048_subject_code_mathematics.sql --schema prisma/schema.prisma

BEGIN;

ALTER TABLE public."studentSubject" DROP CONSTRAINT IF EXISTS "studentSubject_codes_format";
ALTER TABLE public."studentSubject" ADD CONSTRAINT "studentSubject_codes_format"
    CHECK ("subjectCode" ~ '^[A-Za-z0-9_]{2,30}$' AND "boardCode" ~ '^[A-Za-z0-9_]{2,30}$');

UPDATE public."studentSubject"
   SET "subjectCode" = 'Mathematics', "updatedAt" = now()
 WHERE "subjectCode" = 'MATHS';

UPDATE public."testLoadALevel"
   SET "subject" = 'Mathematics'
 WHERE "subject" = 'MATHS';

COMMIT;
