-- Parents agree to the Terms & Copyright notice (/terms) when they sign up.
-- Prisma: UserProfile.termsAcceptedAt
--
-- When they agreed, so there is a record of it. Null for accounts created
-- before the notice existed, and for students and admins, who do not sign up.
--
-- Run once:  psql -d tasteurknowledge -f prisma/sql/024_terms_acceptance.sql

ALTER TABLE public."userProfile"
    ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMPTZ(3);
