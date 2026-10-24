-- One session per account at a time.
-- Prisma: UserProfile.activeSessionKey
--
-- Each login stores a fresh random key here and puts the same key in the
-- session token. A request whose token carries a different key is refused,
-- so signing in on a second device ends the first. Logging out or resetting
-- the password sets it to NULL, which ends the session everywhere.
--
-- Additive and nullable; safe to run more than once.
--
-- Run once:  npx prisma db execute --file prisma/sql/034_single_session.sql --schema prisma/schema.prisma

ALTER TABLE public."userProfile"
    ADD COLUMN IF NOT EXISTS "activeSessionKey" TEXT;
