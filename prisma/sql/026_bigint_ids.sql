-- Every id and foreign key from INTEGER to BIGINT, so no table can run out of
-- ids (INTEGER tops out at 2,147,483,647). Verbal Reasoning was already BIGINT.
-- Prisma: every `id` and FK field is BigInt; the app converts with Number().
--
-- Each ALTER rewrites its table and holds an exclusive lock while it does, so
-- run this when nobody is practising. All of it is one transaction: if any
-- statement fails, nothing changes.
--
-- Counters (order, score, totalCount, questionOrder) stay as they are.
--
-- Run once:  npx prisma db execute --file prisma/sql/026_bigint_ids.sql --schema prisma/schema.prisma

BEGIN;

ALTER TABLE public."userProfile"
    ALTER COLUMN "id" TYPE BIGINT;

ALTER TABLE public."userLoginSession"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "userId" TYPE BIGINT;

ALTER TABLE public."passwordResetToken"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "userId" TYPE BIGINT;

ALTER TABLE public."userPersonalDetails"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "userDetails_Id" TYPE BIGINT;

ALTER TABLE public."userStudentDetails"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "studentId" TYPE BIGINT,
    ALTER COLUMN "parentId" TYPE BIGINT;

ALTER TABLE public."userPaymentDetails"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "userProfile_Id" TYPE BIGINT;

ALTER TABLE public."gsEnglishComp"
    ALTER COLUMN "id" TYPE BIGINT;

ALTER TABLE public."gsEnglishQuestions"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "gsEngCompId" TYPE BIGINT;

ALTER TABLE public."gsMathsQuestions"
    ALTER COLUMN "id" TYPE BIGINT;

ALTER TABLE public."gsNvrQuestions"
    ALTER COLUMN "id" TYPE BIGINT;

ALTER TABLE public."testTrackerNvrMain"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "studentId" TYPE BIGINT;

ALTER TABLE public."testTrackerNvr"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "testId" TYPE BIGINT,
    ALTER COLUMN "questionId" TYPE BIGINT,
    ALTER COLUMN "studentId" TYPE BIGINT;

ALTER TABLE public."testTrackerMathMain"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "studentId" TYPE BIGINT;

ALTER TABLE public."testTrackerMath"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "questionId" TYPE BIGINT,
    ALTER COLUMN "studentId" TYPE BIGINT,
    ALTER COLUMN "testId" TYPE BIGINT;

ALTER TABLE public."testTrackerEnglishMain"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "studentId" TYPE BIGINT,
    ALTER COLUMN "gsEngCompId" TYPE BIGINT;

ALTER TABLE public."testTrackerEnglish"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "testId" TYPE BIGINT,
    ALTER COLUMN "questionId" TYPE BIGINT,
    ALTER COLUMN "studentId" TYPE BIGINT;

-- Legacy tables, still in the Prisma schema but absent from some databases.
ALTER TABLE IF EXISTS public."Attempt"
    ALTER COLUMN "userId" TYPE BIGINT,
    ALTER COLUMN "gsEngCompId" TYPE BIGINT;

ALTER TABLE IF EXISTS public."Answer"
    ALTER COLUMN "gsEngQuestionId" TYPE BIGINT;

-- The id sequences behind autoincrement are INTEGER too, and would still stop
-- at 2,147,483,647 even with a BIGINT column. Widen every one that feeds an id.
DO $$
DECLARE
    t   text;
    seq text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'userProfile', 'userLoginSession', 'passwordResetToken',
        'userPersonalDetails', 'userStudentDetails', 'userPaymentDetails',
        'gsEnglishComp', 'gsEnglishQuestions', 'gsMathsQuestions',
        'gsNvrQuestions', 'testTrackerNvrMain', 'testTrackerNvr',
        'testTrackerMathMain', 'testTrackerMath', 'testTrackerEnglishMain',
        'testTrackerEnglish'
    ]
    LOOP
        seq := pg_get_serial_sequence(format('public.%I', t), 'id');
        IF seq IS NOT NULL THEN
            EXECUTE format('ALTER SEQUENCE %s AS BIGINT', seq);
        END IF;
    END LOOP;
END $$;

COMMIT;
