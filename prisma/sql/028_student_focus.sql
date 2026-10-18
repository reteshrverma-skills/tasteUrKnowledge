-- "Practise this" on the parent's progress page: a topic a parent asks their
-- child to work on, shown on the child's dashboard until the parent removes
-- it. Removing sets clearedAt; rows are never deleted.
-- Prisma: StudentFocus
--
-- Run once:  npx prisma db execute --file prisma/sql/028_student_focus.sql --schema prisma/schema.prisma

CREATE TABLE IF NOT EXISTS public."studentFocus" (
    "id"        BIGSERIAL PRIMARY KEY,
    "studentId" BIGINT NOT NULL
        REFERENCES public."userProfile" ("id") ON DELETE CASCADE,
    "setById"   BIGINT
        REFERENCES public."userProfile" ("id") ON DELETE SET NULL,
    "subject"   TEXT NOT NULL,
    "label"     TEXT NOT NULL,
    "topic"     TEXT,
    "subTopic"  TEXT,
    "level"     TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    "clearedAt" TIMESTAMPTZ(3)
);

-- The child's dashboard reads a child's open focuses on every visit.
CREATE INDEX IF NOT EXISTS "studentFocus_studentId_clearedAt_idx"
    ON public."studentFocus" ("studentId", "clearedAt");
