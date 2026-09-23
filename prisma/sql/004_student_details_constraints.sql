-- Tightens userStudentDetails so Prisma can model it as a real relation:
--   studentYear -> Year(id)        (the column already holds Year ids)
--   studentId   -> one row per student, and required
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/004_student_details_constraints.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Every existing row must point at a real student and a real year,
--    otherwise the constraints below would fail halfway through.
-- ---------------------------------------------------------------------------
DO $$
DECLARE bad INTEGER;
BEGIN
  SELECT count(*) INTO bad FROM "userStudentDetails" WHERE "studentId" IS NULL;
  IF bad > 0 THEN
    RAISE EXCEPTION '% student detail row(s) have no studentId - aborting', bad;
  END IF;

  SELECT count(*) INTO bad
    FROM "userStudentDetails" d
   WHERE d."studentYear" IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM "Year" y WHERE y."id" = d."studentYear");
  IF bad > 0 THEN
    RAISE EXCEPTION '% student detail row(s) reference an unknown year - aborting', bad;
  END IF;

  SELECT count(*) INTO bad
    FROM (SELECT "studentId" FROM "userStudentDetails"
          GROUP BY "studentId" HAVING count(*) > 1) dupes;
  IF bad > 0 THEN
    RAISE EXCEPTION '% student(s) have more than one details row - aborting', bad;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Column types Prisma expects
-- ---------------------------------------------------------------------------
ALTER TABLE "userStudentDetails"
  ALTER COLUMN "studentYear"   TYPE TEXT,
  ALTER COLUMN "schoolAdd1"    TYPE TEXT,
  ALTER COLUMN "schoolAdd2"    TYPE TEXT,
  ALTER COLUMN "schoolAdd3"    TYPE TEXT,
  ALTER COLUMN "schoolCity"    TYPE TEXT,
  ALTER COLUMN "schoolCountry" TYPE TEXT,
  ALTER COLUMN "studentId"     SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. One details row per student
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "userStudentDetails_studentId_key"
  ON "userStudentDetails" ("studentId");

ALTER TABLE "userStudentDetails"
  DROP CONSTRAINT IF EXISTS "userStudentDetails_studentId_fkey";
ALTER TABLE "userStudentDetails"
  ADD CONSTRAINT "userStudentDetails_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "userProfile"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 4. studentYear really is a Year id, so say so
-- ---------------------------------------------------------------------------
ALTER TABLE "userStudentDetails"
  DROP CONSTRAINT IF EXISTS "userStudentDetails_studentYear_fkey";
ALTER TABLE "userStudentDetails"
  ADD CONSTRAINT "userStudentDetails_studentYear_fkey"
  FOREIGN KEY ("studentYear") REFERENCES "Year"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "userStudentDetails_studentYear_idx"
  ON "userStudentDetails" ("studentYear");

COMMIT;
