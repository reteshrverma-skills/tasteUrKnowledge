-- The Year table is now the master list of school classes (Year 4, Year 5...)
-- that every school's pupils and teachers are placed in, so it is renamed.
-- Prisma: model Year keeps its name, with @@map("masterSchoolClass").
--
-- Foreign keys that point at it (userStudentDetails.studentYear, Subject,
-- schoolYearTeacher) follow the rename on their own; no data changes.
-- Deploy the matching schema.prisma at the same time: code built before
-- this still asks for "Year".
--
-- Run once:  npx prisma db execute --file prisma/sql/037_rename_year_to_master_school_class.sql --schema prisma/schema.prisma

BEGIN;

ALTER TABLE IF EXISTS public."Year" RENAME TO "masterSchoolClass";
ALTER TABLE public."masterSchoolClass" RENAME CONSTRAINT "Year_pkey" TO "masterSchoolClass_pkey";
ALTER INDEX IF EXISTS public."Year_name_key" RENAME TO "masterSchoolClass_name_key";

COMMIT;
