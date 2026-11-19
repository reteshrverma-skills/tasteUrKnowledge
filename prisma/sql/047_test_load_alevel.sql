-- A-Level test results loaded for a student: one header row per test paper
-- and one detail row per question / sub-question with its marks.
--
--   testLoadALevel        - the test: student, subject, board, total marks.
--   testLoadALevelDetail  - each question part: topic, subtopic, marks.
--
--   * subject / board are codes from src/config/senior-subjects.json
--     (e.g. MATHS, AQA), not foreign keys - the list lives in the config.
--   * Marks are whole numbers; awardedMarks can never exceed totalMarks.
--
-- Additive only: two new tables. No existing row is changed. Running it
-- again does nothing.
--
-- Run this BEFORE deploying the matching schema.prisma.
--
-- Run once:  npx prisma db execute --file prisma/sql/047_test_load_alevel.sql --schema prisma/schema.prisma

BEGIN;

CREATE TABLE IF NOT EXISTS public."testLoadALevel" (
    "id"           BIGSERIAL      PRIMARY KEY,
    "testName"     TEXT           NOT NULL,
    "studentId"    BIGINT         NOT NULL REFERENCES public."userProfile" ("id") ON DELETE CASCADE,
    "subject"      TEXT           NOT NULL,
    "board"        TEXT           NOT NULL,
    "awardedMarks" INTEGER        NOT NULL DEFAULT 0,
    "totalMarks"   INTEGER        NOT NULL,
    "uploadDate"   TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    "testDate"     DATE,
    CONSTRAINT "testLoadALevel_marks_check"
        CHECK ("totalMarks" > 0 AND "awardedMarks" >= 0 AND "awardedMarks" <= "totalMarks")
);

CREATE INDEX IF NOT EXISTS "testLoadALevel_studentId_subject_testDate_idx"
    ON public."testLoadALevel" ("studentId", "subject", "testDate");

CREATE TABLE IF NOT EXISTS public."testLoadALevelDetail" (
    "id"            BIGSERIAL      PRIMARY KEY,
    "testId"        BIGINT         NOT NULL REFERENCES public."testLoadALevel" ("id") ON DELETE CASCADE,
    "qNumber"       SMALLINT       NOT NULL,
    -- e.g. "a", "b(ii)"; null when the question has no parts.
    "subQuestionNo" TEXT,
    "topic"         TEXT,
    "subtopic"      TEXT,
    "awardedMarks"  INTEGER        NOT NULL DEFAULT 0,
    "totalMarks"    INTEGER        NOT NULL,
    "updateDate"    TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    CONSTRAINT "testLoadALevelDetail_marks_check"
        CHECK ("totalMarks" > 0 AND "awardedMarks" >= 0 AND "awardedMarks" <= "totalMarks")
);

CREATE INDEX IF NOT EXISTS "testLoadALevelDetail_testId_qNumber_idx"
    ON public."testLoadALevelDetail" ("testId", "qNumber");
CREATE INDEX IF NOT EXISTS "testLoadALevelDetail_topic_subtopic_idx"
    ON public."testLoadALevelDetail" ("topic", "subtopic");

COMMIT;
