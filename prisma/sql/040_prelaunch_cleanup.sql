-- Pre-launch cleanup: drops tables (and one column) that no code reads or
-- writes and that are not in schema.prisma. Their rows go with them:
--
--   "Dummy_NvrQuestions"               2,500 rows  - a scratch copy of NVR
--                                                    questions; nothing uses it.
--   "schoolClass"                          4 rows  - early draft of 036; classes
--                                                    are coreSchoolClass now.
--   "userStudentDetails"."schoolClassId"           - early draft of 036; points
--                                                    at schoolClass.
--
-- Run AFTER 038 (which clears the early-draft schoolClassTeacher). Check the
-- counts first; the drop runs in one transaction and has no CASCADE, so an
-- unexpected dependency makes it fail rather than remove anything else.
--
-- Run once:  npx prisma db execute --file prisma/sql/040_prelaunch_cleanup.sql --schema prisma/schema.prisma

-- 1. Look first (run on its own):
-- SELECT
--   (SELECT count(*) FROM public."Dummy_NvrQuestions") AS dummy_nvr_rows,
--   (SELECT count(*) FROM public."schoolClass") AS school_class_rows,
--   (SELECT count(*) FROM public."userStudentDetails" WHERE "schoolClassId" IS NOT NULL) AS pupils_with_school_class;

-- 2. Drop:
BEGIN;

ALTER TABLE public."userStudentDetails" DROP COLUMN IF EXISTS "schoolClassId";
DROP TABLE IF EXISTS public."schoolClass";
DROP TABLE IF EXISTS public."Dummy_NvrQuestions";

COMMIT;
