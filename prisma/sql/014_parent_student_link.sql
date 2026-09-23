-- Gives a parent many children.
--
-- The link today is "userProfile"."student_parent_ref": a PARENT row holding
-- one student's profileName as text. That is one parent to one child, with no
-- foreign key behind it, so a typo or a renamed login silently breaks it.
--
-- A parent signing up now manages a Kids Profile list, so the link moves onto
-- the child and becomes a real key:
--
--   userStudentDetails.parentId -> userProfile.id
--
-- One row per child, each naming its parent. One parent, many children.
--
-- Purely additive. student_parent_ref is left exactly as it is - nothing reads
-- it after this, but no column and no row is removed, so an older deployment
-- pointed at this database keeps working.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/014_parent_student_link.sql

BEGIN;

ALTER TABLE "userStudentDetails"
  ADD COLUMN IF NOT EXISTS "parentId" INTEGER;

-- SET NULL, not CASCADE: a child's work must outlive the parent account that
-- happened to create it.
ALTER TABLE "userStudentDetails"
  DROP CONSTRAINT IF EXISTS "userStudentDetails_parentId_fkey";
ALTER TABLE "userStudentDetails"
  ADD CONSTRAINT "userStudentDetails_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "userProfile" ("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Serves "every child of this parent", which the Kids Profile page runs on
-- every load.
CREATE INDEX IF NOT EXISTS "userStudentDetails_parentId_idx"
  ON "userStudentDetails" ("parentId");

-- ---------------------------------------------------------------------------
-- Carry over any link that already exists in the old text column.
--
-- Only fills a NULL parentId, so re-running cannot overwrite a link a parent
-- has since changed. No rows exist to convert today; this is here so the
-- migration stays correct if it is run against an older copy.
-- ---------------------------------------------------------------------------
UPDATE "userStudentDetails" d
   SET "parentId" = p."id"
  FROM "userProfile" p
  JOIN "userProfile" s ON s."profileName" = p."student_parent_ref"
 WHERE p."userType" = 'PARENT'
   AND s."id" = d."studentId"
   AND d."parentId" IS NULL;

DO $$
DECLARE linked INTEGER;
BEGIN
  SELECT count(*) INTO linked
    FROM "userStudentDetails" WHERE "parentId" IS NOT NULL;
  RAISE NOTICE '% child profile(s) now linked to a parent', linked;
END $$;

COMMIT;
