-- A school's logo, added by its School Admin. Held in the database rather than
-- on disk because every deploy wipes the App Service's files. Removing a logo
-- clears these columns; no row is ever deleted. Running it again does nothing.
--
-- Run this BEFORE deploying the matching schema.prisma: the school and teacher
-- pages read logoUpdatedAt and fail without it.
--
-- Run once:  npx prisma db execute --file prisma/sql/042_school_logo.sql --schema prisma/schema.prisma

ALTER TABLE public."coreSchool"
    ADD COLUMN IF NOT EXISTS "logoData" BYTEA,
    ADD COLUMN IF NOT EXISTS "logoType" TEXT,
    ADD COLUMN IF NOT EXISTS "logoUpdatedAt" TIMESTAMPTZ(3);
