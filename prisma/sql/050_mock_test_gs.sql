-- Grammar School mock tests: fixed papers sat under exam conditions.
--
-- A paper (mockTestGs) has 2 sets. Each set has 4 sections - English
-- (1 comprehension, 15-20 questions), Maths, Verbal and Non-Verbal (20 each).
-- Every student gets the same questions in the same order.
--
--   mockTestGs              the paper: when it opens, how many days it stays
--                           open, the break between sets, admin approval.
--   mockTestGsSection       one row per set and subject; the admin sets each
--                           section's time (durationMinutes).
--   mockTestGsComp          the comprehension passage, one per set.
--   mockTestGsQuestion      every question of the paper, in order.
--   mockTestAttempt         one student sitting one set. No retakes:
--                           unique per paper, student and set.
--   mockTestSectionAttempt  one section of a sitting; endsAt is the deadline
--                           the server enforces (resume carries on to it).
--   mockTestResults         one answer.
--   mockTestFinalResult     the student's total for the whole paper.
--
-- Rules the app follows (not all expressible here):
--   * A paper closes at 23:59:59 Europe/London on testDate + availableDays - 1.
--     Anything unfinished then is marked 'paper_closed'.
--   * Each section has its own countdown and locks when it ends. The set's
--     time is the sum of its sections. endsAt never runs past the closing time.
--   * After Set 1, a breakMinutes countdown; Set 2 starts when the student
--     clicks Start or when the break ends, whichever comes first.
--   * Question counts (English 15-20, others 20) are checked when the admin
--     approves the paper, not row by row.
--
-- Additive only: new tables, no existing row is changed. Running it again
-- does nothing. Nothing here is ever deleted by the app: questions are
-- protected by ON DELETE RESTRICT from the answers that refer to them.
--
-- Run this BEFORE deploying the matching schema.prisma.
--
-- Run once:  npx prisma db execute --file prisma/sql/050_mock_test_gs.sql --schema prisma/schema.prisma

BEGIN;

-- ---------------------------------------------------------------------------
-- The paper
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."mockTestGs" (
    "id"                  BIGSERIAL      PRIMARY KEY,
    "name"                TEXT           NOT NULL,
    "stage"               TEXT,
    "programmeCode"       TEXT           NOT NULL DEFAULT 'GRAMMAR'
                          REFERENCES public."coreProgramme" ("code") ON UPDATE CASCADE ON DELETE RESTRICT,
    -- First day students can start; the paper is open for availableDays days.
    "testDate"            DATE           NOT NULL,
    "availableDays"       SMALLINT       NOT NULL DEFAULT 7,
    -- Break between Set 1 and Set 2, in minutes.
    "breakMinutes"        SMALLINT       NOT NULL DEFAULT 15,
    -- Students see a paper only once an admin has approved it.
    "approvedByAdmin"     BOOLEAN        NOT NULL DEFAULT FALSE,
    "approvedByAdminDate" TIMESTAMPTZ(3),
    "createdDate"         TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    CONSTRAINT "mockTestGs_availableDays_check" CHECK ("availableDays" BETWEEN 1 AND 365),
    CONSTRAINT "mockTestGs_breakMinutes_check"  CHECK ("breakMinutes" BETWEEN 0 AND 120)
);

CREATE INDEX IF NOT EXISTS "mockTestGs_programme_approved_testDate_idx"
    ON public."mockTestGs" ("programmeCode", "approvedByAdmin", "testDate");

-- ---------------------------------------------------------------------------
-- Sections: one per set and subject, with the admin-set time
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."mockTestGsSection" (
    "id"              BIGSERIAL PRIMARY KEY,
    "testId"          BIGINT    NOT NULL REFERENCES public."mockTestGs" ("id") ON DELETE CASCADE,
    "setNo"           SMALLINT  NOT NULL,
    -- ENGLISH | MATHS | VERBAL | NON_VERBAL
    "subject"         TEXT      NOT NULL,
    -- Order the sections are sat in within the set.
    "sectionOrder"    SMALLINT  NOT NULL,
    "durationMinutes" SMALLINT  NOT NULL,
    CONSTRAINT "mockTestGsSection_setNo_check"    CHECK ("setNo" IN (1, 2)),
    CONSTRAINT "mockTestGsSection_subject_check"  CHECK ("subject" IN ('ENGLISH', 'MATHS', 'VERBAL', 'NON_VERBAL')),
    CONSTRAINT "mockTestGsSection_duration_check" CHECK ("durationMinutes" BETWEEN 1 AND 120)
);

CREATE UNIQUE INDEX IF NOT EXISTS "mockTestGsSection_testId_setNo_subject_key"
    ON public."mockTestGsSection" ("testId", "setNo", "subject");
CREATE UNIQUE INDEX IF NOT EXISTS "mockTestGsSection_testId_setNo_sectionOrder_key"
    ON public."mockTestGsSection" ("testId", "setNo", "sectionOrder");

-- ---------------------------------------------------------------------------
-- Comprehension passage: one per set
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."mockTestGsComp" (
    "id"        BIGSERIAL PRIMARY KEY,
    "testId"    BIGINT    NOT NULL REFERENCES public."mockTestGs" ("id") ON DELETE CASCADE,
    "setNo"     SMALLINT  NOT NULL,
    "label"     TEXT,
    "compStory" TEXT      NOT NULL,
    CONSTRAINT "mockTestGsComp_setNo_check" CHECK ("setNo" IN (1, 2))
);

CREATE UNIQUE INDEX IF NOT EXISTS "mockTestGsComp_testId_setNo_key"
    ON public."mockTestGsComp" ("testId", "setNo");
-- Lets a question's foreign key prove its passage is from the same paper and set.
CREATE UNIQUE INDEX IF NOT EXISTS "mockTestGsComp_id_testId_setNo_key"
    ON public."mockTestGsComp" ("id", "testId", "setNo");

-- ---------------------------------------------------------------------------
-- Questions: every question of the paper, in order
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."mockTestGsQuestion" (
    "id"             BIGSERIAL PRIMARY KEY,
    "testId"         BIGINT    NOT NULL,
    "setNo"          SMALLINT  NOT NULL,
    "subject"        TEXT      NOT NULL,
    -- The set's passage; English questions only.
    "compId"         BIGINT,
    "questionOrder"  SMALLINT  NOT NULL,
    "topic"          TEXT,
    "subTopic"       TEXT,
    -- "Inference", "Mirror image"... what the progress report groups by.
    "typeOfQuestion" TEXT,
    "quest"          TEXT      NOT NULL,
    -- Diagram above the question: "none" | "svg" | "url" (Maths diagrams, NVR figures).
    "stemFormat"     TEXT      NOT NULL DEFAULT 'none',
    "stemFigure"     TEXT,
    -- How options are shown: "text" | "svg" | "url".
    "optionFormat"   TEXT      NOT NULL DEFAULT 'text',
    "optionA"        TEXT      NOT NULL,
    "optionB"        TEXT      NOT NULL,
    "optionC"        TEXT      NOT NULL,
    "optionD"        TEXT      NOT NULL,
    "optionE"        TEXT,
    "correctAnswer"  CHAR(1)   NOT NULL,
    "explanation"    TEXT,
    "createdDate"    TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    -- The section must exist; deleting the paper takes its questions with it,
    -- unless a student has answered them (mockTestResults restricts that).
    CONSTRAINT "mockTestGsQuestion_section_fkey"
        FOREIGN KEY ("testId", "setNo", "subject")
        REFERENCES public."mockTestGsSection" ("testId", "setNo", "subject") ON DELETE CASCADE,
    -- The passage must belong to the same paper and set.
    CONSTRAINT "mockTestGsQuestion_comp_fkey"
        FOREIGN KEY ("compId", "testId", "setNo")
        REFERENCES public."mockTestGsComp" ("id", "testId", "setNo") ON DELETE CASCADE,
    CONSTRAINT "mockTestGsQuestion_comp_check"
        CHECK (("subject" = 'ENGLISH') = ("compId" IS NOT NULL)),
    CONSTRAINT "mockTestGsQuestion_answer_check"
        CHECK ("correctAnswer" IN ('A', 'B', 'C', 'D', 'E')
               AND ("correctAnswer" <> 'E' OR "optionE" IS NOT NULL)),
    CONSTRAINT "mockTestGsQuestion_stemFormat_check"   CHECK ("stemFormat" IN ('none', 'svg', 'url')),
    CONSTRAINT "mockTestGsQuestion_optionFormat_check" CHECK ("optionFormat" IN ('text', 'svg', 'url')),
    -- Figures become live markup in the browser: refuse anything executable,
    -- as gsNvrQuestions does (migration 018). The renderer strips again.
    CONSTRAINT "mockTestGsQuestion_no_markup" CHECK (
        coalesce("stemFigure", '') || "optionA" || "optionB" || "optionC"
          || "optionD" || coalesce("optionE", '')
        !~* '<script|<foreignObject|<use\M|<animate|<set\M|javascript:|\mon[a-z]+\s*='
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS "mockTestGsQuestion_testId_setNo_subject_questionOrder_key"
    ON public."mockTestGsQuestion" ("testId", "setNo", "subject", "questionOrder");
CREATE INDEX IF NOT EXISTS "mockTestGsQuestion_compId_idx"
    ON public."mockTestGsQuestion" ("compId");

-- ---------------------------------------------------------------------------
-- A student sitting one set (no retakes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."mockTestAttempt" (
    "id"               BIGSERIAL      PRIMARY KEY,
    "testId"           BIGINT         NOT NULL REFERENCES public."mockTestGs" ("id") ON DELETE RESTRICT,
    "studentId"        BIGINT         NOT NULL REFERENCES public."userProfile" ("id") ON DELETE CASCADE,
    "setNo"            SMALLINT       NOT NULL,
    "startedAt"        TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    "submittedAt"      TIMESTAMPTZ(3),
    -- null while in progress; "submitted" | "timed_out" | "paper_closed"
    "completionReason" TEXT,
    "marksObtained"    INTEGER,
    "totalMarks"       INTEGER,
    CONSTRAINT "mockTestAttempt_setNo_check" CHECK ("setNo" IN (1, 2)),
    CONSTRAINT "mockTestAttempt_reason_check"
        CHECK ("completionReason" IS NULL OR "completionReason" IN ('submitted', 'timed_out', 'paper_closed')),
    CONSTRAINT "mockTestAttempt_marks_check"
        CHECK ("marksObtained" IS NULL OR ("marksObtained" >= 0 AND "marksObtained" <= "totalMarks"))
);

CREATE UNIQUE INDEX IF NOT EXISTS "mockTestAttempt_testId_studentId_setNo_key"
    ON public."mockTestAttempt" ("testId", "studentId", "setNo");
CREATE INDEX IF NOT EXISTS "mockTestAttempt_studentId_startedAt_idx"
    ON public."mockTestAttempt" ("studentId", "startedAt");

-- ---------------------------------------------------------------------------
-- One section of a sitting; endsAt is the deadline the server enforces
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."mockTestSectionAttempt" (
    "id"                 BIGSERIAL      PRIMARY KEY,
    "attemptId"          BIGINT         NOT NULL REFERENCES public."mockTestAttempt" ("id") ON DELETE CASCADE,
    "sectionId"          BIGINT         NOT NULL REFERENCES public."mockTestGsSection" ("id") ON DELETE RESTRICT,
    "startedAt"          TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    -- startedAt + durationMinutes, cut short at the paper's closing time.
    "endsAt"             TIMESTAMPTZ(3) NOT NULL,
    "endedAt"            TIMESTAMPTZ(3),
    -- null while in progress; "submitted" | "timed_out" | "paper_closed"
    "completionReason"   TEXT,
    "correct"            INTEGER,
    "total"              INTEGER,
    -- English: seconds from the passage appearing to the first answer.
    "passageReadSeconds" DECIMAL(7, 2),
    CONSTRAINT "mockTestSectionAttempt_reason_check"
        CHECK ("completionReason" IS NULL OR "completionReason" IN ('submitted', 'timed_out', 'paper_closed')),
    CONSTRAINT "mockTestSectionAttempt_ends_check" CHECK ("endsAt" >= "startedAt")
);

CREATE UNIQUE INDEX IF NOT EXISTS "mockTestSectionAttempt_attemptId_sectionId_key"
    ON public."mockTestSectionAttempt" ("attemptId", "sectionId");

-- ---------------------------------------------------------------------------
-- One answer
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."mockTestResults" (
    "id"                  BIGSERIAL      PRIMARY KEY,
    "sectionAttemptId"    BIGINT         NOT NULL REFERENCES public."mockTestSectionAttempt" ("id") ON DELETE CASCADE,
    -- Restrict: deleting a question must not erase a child's answer to it.
    "questionId"          BIGINT         NOT NULL REFERENCES public."mockTestGsQuestion" ("id") ON DELETE RESTRICT,
    "studentId"           BIGINT         NOT NULL REFERENCES public."userProfile" ("id") ON DELETE CASCADE,
    -- null when skipped.
    "chosenOption"        CHAR(1),
    "correctOption"       CHAR(1)        NOT NULL,
    "isCorrect"           BOOLEAN        NOT NULL DEFAULT FALSE,
    "isSkipped"           BOOLEAN        NOT NULL DEFAULT FALSE,
    -- Seconds, to 2dp, clamped server-side before it is stored.
    "timeSpentOnQuestion" DECIMAL(7, 2),
    "questionOrder"       SMALLINT,
    -- Snapshot of the question type, which the progress report groups by.
    "topic"               TEXT,
    "flaggedUnclear"      BOOLEAN        NOT NULL DEFAULT FALSE,
    "answeredAt"          TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    CONSTRAINT "mockTestResults_chosen_check"
        CHECK ("chosenOption" IS NULL OR "chosenOption" IN ('A', 'B', 'C', 'D', 'E'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "mockTestResults_sectionAttemptId_questionId_key"
    ON public."mockTestResults" ("sectionAttemptId", "questionId");
CREATE INDEX IF NOT EXISTS "mockTestResults_studentId_questionId_idx"
    ON public."mockTestResults" ("studentId", "questionId");

-- ---------------------------------------------------------------------------
-- The student's total for the whole paper
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."mockTestFinalResult" (
    "id"            BIGSERIAL      PRIMARY KEY,
    "testId"        BIGINT         NOT NULL REFERENCES public."mockTestGs" ("id") ON DELETE RESTRICT,
    "studentId"     BIGINT         NOT NULL REFERENCES public."userProfile" ("id") ON DELETE CASCADE,
    "marksObtained" INTEGER        NOT NULL,
    "totalMarks"    INTEGER        NOT NULL,
    "completedAt"   TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    CONSTRAINT "mockTestFinalResult_marks_check"
        CHECK ("totalMarks" > 0 AND "marksObtained" >= 0 AND "marksObtained" <= "totalMarks")
);

CREATE UNIQUE INDEX IF NOT EXISTS "mockTestFinalResult_testId_studentId_key"
    ON public."mockTestFinalResult" ("testId", "studentId");

COMMIT;
