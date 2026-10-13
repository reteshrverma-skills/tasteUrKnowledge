-- English comprehensions need an admin's approval before students see them.
-- Applied by hand on 2026-10-13; recorded here to match the live table.
-- Prisma: GsEnglishComp.approvedByAdmin / approvedByAdminDate / createdDate.
--
-- No defaults on purpose: a passage created afterwards starts with
-- approvedbyadmin NULL, which the app treats as not approved.

ALTER TABLE public."gsEnglishComp"
    ADD COLUMN IF NOT EXISTS approvedbyadmin BOOLEAN,
    ADD COLUMN IF NOT EXISTS approvedbyadmindate DATE,
    ADD COLUMN IF NOT EXISTS createddate DATE;

-- Everything that existed before approval was introduced stays visible.
UPDATE public."gsEnglishComp"
SET
    approvedbyadmin = TRUE,
    approvedbyadmindate = CURRENT_DATE,
    createddate = CURRENT_DATE;
