-- Schools: a Product Director creates a school and its School Admin; the
-- School Admin creates teachers and puts them on Years; a teacher (or the
-- School Admin) creates pupils in a Year. In class a teacher logs in, picks a pupil and the device
-- switches to that pupil's practice - pupils have no password of their own.
-- Prisma: enum UserType gains SCHOOL_ADMIN and TEACHER; School,
-- SchoolYearTeacher, ClassroomSession; UserProfile.schoolId,
-- allowMultipleSessions, pinHash; UserProfile.profilePassword nullable
--
-- ADD VALUE cannot run inside a transaction block on older Postgres, so this
-- file has no BEGIN/COMMIT. Additive only; safe to run more than once.
--
-- Run once:  npx prisma db execute --file prisma/sql/036_schools.sql --schema prisma/schema.prisma

ALTER TYPE "UserType" ADD VALUE IF NOT EXISTS 'SCHOOL_ADMIN';
ALTER TYPE "UserType" ADD VALUE IF NOT EXISTS 'TEACHER';

CREATE TABLE IF NOT EXISTS public."school" (
    "id"            BIGSERIAL PRIMARY KEY,
    "name"          TEXT NOT NULL,
    "address1"      TEXT,
    "address2"      TEXT,
    "city"          TEXT,
    "postcode"      TEXT,
    "contactEmail"  TEXT,
    "programmeCode" TEXT NOT NULL DEFAULT 'GRAMMAR'
        REFERENCES public."programme" ("code") ON UPDATE CASCADE ON DELETE RESTRICT,
    -- Pupil seats the school has; null means no limit.
    "maxStudents"   INTEGER,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "createdById"   BIGINT
        REFERENCES public."userProfile" ("id") ON DELETE SET NULL,
    "createdAt"     TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

-- Which school an account belongs to: null for parents, home students,
-- admins and product directors.
ALTER TABLE public."userProfile"
    ADD COLUMN IF NOT EXISTS "schoolId" BIGINT
        REFERENCES public."school" ("id") ON DELETE RESTRICT;
-- Teachers sign in on several classroom devices at once.
ALTER TABLE public."userProfile"
    ADD COLUMN IF NOT EXISTS "allowMultipleSessions" BOOLEAN NOT NULL DEFAULT false;
-- bcrypt hash of a teacher's 4-digit PIN, which ends a pupil's turn.
ALTER TABLE public."userProfile"
    ADD COLUMN IF NOT EXISTS "pinHash" TEXT;
-- School pupils have no password: they are opened by their teacher, and a
-- null password can never sign in. Every other account still sets one.
ALTER TABLE public."userProfile"
    ALTER COLUMN "profilePassword" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "userProfile_schoolId_idx"
    ON public."userProfile" ("schoolId");

-- A school's classes are the Years (Year 4, Year 5...): a pupil's class is
-- their userStudentDetails.studentYear. This says which teachers take which
-- Years in which school; a teacher may take several.
CREATE TABLE IF NOT EXISTS public."schoolYearTeacher" (
    "id"        BIGSERIAL PRIMARY KEY,
    "schoolId"  BIGINT NOT NULL
        REFERENCES public."school" ("id") ON DELETE RESTRICT,
    "yearId"    TEXT NOT NULL
        REFERENCES public."Year" ("id") ON DELETE RESTRICT,
    "teacherId" BIGINT NOT NULL
        REFERENCES public."userProfile" ("id") ON DELETE RESTRICT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    -- Set when the teacher is taken off the Year; rows are never deleted, and
    -- putting them back clears it.
    "removedAt" TIMESTAMPTZ(3)
);

-- For a table created by an earlier draft of this file, before removedAt.
ALTER TABLE public."schoolYearTeacher"
    ADD COLUMN IF NOT EXISTS "removedAt" TIMESTAMPTZ(3);

CREATE UNIQUE INDEX IF NOT EXISTS "schoolYearTeacher_teacherId_yearId_key"
    ON public."schoolYearTeacher" ("teacherId", "yearId");
CREATE INDEX IF NOT EXISTS "schoolYearTeacher_schoolId_yearId_idx"
    ON public."schoolYearTeacher" ("schoolId", "yearId");

-- One row each time a teacher opens a pupil on a device: who, by whom, when,
-- and how it ended. Rows are closed, never deleted.
CREATE TABLE IF NOT EXISTS public."classroomSession" (
    "id"        BIGSERIAL PRIMARY KEY,
    "studentId" BIGINT NOT NULL
        REFERENCES public."userProfile" ("id") ON DELETE CASCADE,
    "teacherId" BIGINT NOT NULL
        REFERENCES public."userProfile" ("id") ON DELETE RESTRICT,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    "endedAt"   TIMESTAMPTZ(3),
    -- "exit" | "ended_by_teacher" | "replaced" | "idle" | "school_inactive"
    "endReason" TEXT,
    "userAgent" TEXT
);

CREATE INDEX IF NOT EXISTS "classroomSession_teacherId_endedAt_idx"
    ON public."classroomSession" ("teacherId", "endedAt");
CREATE INDEX IF NOT EXISTS "classroomSession_studentId_endedAt_idx"
    ON public."classroomSession" ("studentId", "endedAt");
