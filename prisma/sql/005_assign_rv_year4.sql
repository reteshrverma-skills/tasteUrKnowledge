-- Gives the student 'rv' a school year. Without a userStudentDetails row a
-- student is scoped to no year at all, so their dashboard shows nothing.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/005_assign_rv_year4.sql

BEGIN;

INSERT INTO "userStudentDetails" ("studentId", "studentYear")
SELECT p."id", y."id"
FROM "userProfile" p
CROSS JOIN "Year" y
WHERE p."profileName" = 'rv'
  AND y."name" = 'Year 4'
ON CONFLICT ("studentId") DO UPDATE
  SET "studentYear" = EXCLUDED."studentYear";

DO $$
DECLARE assigned TEXT;
BEGIN
  SELECT y."name" INTO assigned
    FROM "userProfile" p
    JOIN "userStudentDetails" d ON d."studentId" = p."id"
    JOIN "Year" y               ON y."id" = d."studentYear"
   WHERE p."profileName" = 'rv';

  IF assigned IS DISTINCT FROM 'Year 4' THEN
    RAISE EXCEPTION 'rv was not assigned to Year 4 (got %) - aborting', assigned;
  END IF;
END $$;

COMMIT;
