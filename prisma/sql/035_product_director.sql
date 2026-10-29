-- A fourth account type: Product Director. Signs in to a read-only page of
-- user statistics (/director) - accounts by type, students logged in, practice
-- time - with no access to student, parent or admin pages.
-- Prisma: enum UserType gains PRODUCT_DIRECTOR
--
-- Accounts of this type are created by an admin at /admin/director-accounts.
--
-- ADD VALUE cannot run inside a transaction block on older Postgres, so this
-- file has no BEGIN/COMMIT. Safe to run more than once.
--
-- Run once:  npx prisma db execute --file prisma/sql/035_product_director.sql --schema prisma/schema.prisma

ALTER TYPE "UserType" ADD VALUE IF NOT EXISTS 'PRODUCT_DIRECTOR';
