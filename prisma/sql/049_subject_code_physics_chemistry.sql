-- Renames the subject codes PHYSICS to Physics and CHEMISTRY to Chemistry in
-- studentSubject and testLoadALevel, to match src/config/senior-subjects.json
-- (as 048 did for Mathematics).
--
--   * UPDATE only; no row is deleted. Running it again does nothing.
--   * Needs 048 first (it relaxed studentSubject_codes_format to allow lower case).
--
-- Run once:  npx prisma db execute --file prisma/sql/049_subject_code_physics_chemistry.sql --schema prisma/schema.prisma

BEGIN;

UPDATE public."studentSubject"
   SET "subjectCode" = 'Physics', "updatedAt" = now()
 WHERE "subjectCode" = 'PHYSICS';

UPDATE public."studentSubject"
   SET "subjectCode" = 'Chemistry', "updatedAt" = now()
 WHERE "subjectCode" = 'CHEMISTRY';

UPDATE public."testLoadALevel"
   SET "subject" = 'Physics'
 WHERE "subject" = 'PHYSICS';

UPDATE public."testLoadALevel"
   SET "subject" = 'Chemistry'
 WHERE "subject" = 'CHEMISTRY';

COMMIT;
