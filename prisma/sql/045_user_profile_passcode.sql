-- A 6-digit passcode a student can sign in with instead of their password.
--
--   * Stored as a bcrypt hash in userProfile."profilePasscode", like the
--     password. Set and reset by the student's linked parent.
--   * Only ever set for a STUDENT.
--
-- Additive only: one new nullable column and a check. No row is deleted and no
-- existing value is changed. Running it again does nothing.
--
-- Run this BEFORE deploying the matching schema.prisma: the app reads
-- userProfile."profilePasscode" and fails without it.
--
-- Run once:  npx prisma db execute --file prisma/sql/045_user_profile_passcode.sql --schema prisma/schema.prisma

ALTER TABLE public."userProfile"
    ADD COLUMN IF NOT EXISTS "profilePasscode" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'userProfile_passcode_student_only') THEN
        ALTER TABLE public."userProfile"
            ADD CONSTRAINT "userProfile_passcode_student_only"
            CHECK ("userType" = 'STUDENT' OR "profilePasscode" IS NULL);
    END IF;
END $$;
