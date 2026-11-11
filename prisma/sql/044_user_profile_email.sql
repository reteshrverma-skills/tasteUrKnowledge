-- A login email on userProfile, so "sign in with your email" is one indexed
-- lookup instead of a join through userPersonalDetails.
--
--   * Stored lower-case and unique, so one email names one account.
--   * Never set for a STUDENT: pupils sign in with their user ID only.
--   * userPersonalDetails."emailAddress" stays as the contact email; the app
--     writes both together from now on.
--
-- Additive only: one new column, filled from existing data. No row is deleted
-- and no existing value is changed. Running it again does nothing.
--
-- Run this BEFORE deploying the matching schema.prisma: the app reads
-- userProfile."email" and fails without it.
--
-- Run once:  npx prisma db execute --file prisma/sql/044_user_profile_email.sql --schema prisma/schema.prisma

ALTER TABLE public."userProfile"
    ADD COLUMN IF NOT EXISTS "email" VARCHAR(254);

-- Fill from the contact email for every non-student whose email no other
-- non-student shares. A shared email is left empty here (those accounts keep
-- signing in with their user ID); the query at the bottom lists them.
WITH candidate AS (
    SELECT p.id, lower(trim(d."emailAddress")) AS email
      FROM public."userProfile" p
      JOIN public."userPersonalDetails" d ON d."userDetails_Id" = p.id
     WHERE p."userType" <> 'STUDENT'
       AND p."email" IS NULL
       AND d."emailAddress" ~ '^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$'
), unique_email AS (
    SELECT email FROM candidate GROUP BY email HAVING count(*) = 1
)
UPDATE public."userProfile" p
   SET "email" = c.email
  FROM candidate c
  JOIN unique_email u ON u.email = c.email
 WHERE p.id = c.id
   AND NOT EXISTS (SELECT 1 FROM public."userProfile" x WHERE x."email" = c.email);

CREATE UNIQUE INDEX IF NOT EXISTS "userProfile_email_key"
    ON public."userProfile" ("email");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'userProfile_email_not_student') THEN
        ALTER TABLE public."userProfile"
            ADD CONSTRAINT "userProfile_email_not_student"
            CHECK ("userType" <> 'STUDENT' OR "email" IS NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'userProfile_email_lower') THEN
        ALTER TABLE public."userProfile"
            ADD CONSTRAINT "userProfile_email_lower"
            CHECK ("email" = lower("email"));
    END IF;
END $$;

-- Accounts left without a login email because they share one (read only):
--
-- SELECT lower(trim(d."emailAddress")) AS email, p.id, p."profileName", p."userType"
--   FROM public."userProfile" p
--   JOIN public."userPersonalDetails" d ON d."userDetails_Id" = p.id
--  WHERE p."userType" <> 'STUDENT' AND p."email" IS NULL AND d."emailAddress" IS NOT NULL
--  ORDER BY 1, 2;
