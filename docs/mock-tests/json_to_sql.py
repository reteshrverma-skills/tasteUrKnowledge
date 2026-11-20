"""Turns a mock-test set JSON (from build_mock*_set*.py) into an INSERT script.

Usage:  python -I docs/mock-tests/json_to_sql.py <set.json> <out.sql>

The script is safe to run more than once: it reuses the paper if one with the
same name already exists, and does nothing if that set is already loaded.
Insert only; it never updates or deletes a row.
"""
import json, sys
from pathlib import Path

src, out = Path(sys.argv[1]), Path(sys.argv[2])
d = json.loads(src.read_text(encoding="utf-8"))
paper, set_no = d["paper"], int(d["setNo"])

def q(v):
    """A SQL literal. Dollar quoting keeps SVG and apostrophes untouched."""
    if v is None:
        return "NULL"
    s = str(v)
    assert "$q$" not in s
    return f"$q${s}$q$"

cols = ['"testId"', '"setNo"', '"subject"', '"compId"', '"questionOrder"', '"topic"', '"subTopic"',
        '"typeOfQuestion"', '"quest"', '"stemFormat"', '"stemFigure"', '"optionFormat"',
        '"optionA"', '"optionB"', '"optionC"', '"optionD"', '"optionE"', '"correctAnswer"', '"explanation"']
rows = []
for x in d["questions"]:
    comp = "v_comp" if x["subject"] == "ENGLISH" else "NULL"
    vals = ["v_test", str(set_no), q(x["subject"]), comp, str(x["questionOrder"]), q(x["topic"]),
            q(x["subTopic"]), q(x["typeOfQuestion"]), q(x["quest"]), q(x["stemFormat"]), q(x["stemFigure"]),
            q(x["optionFormat"]), q(x["optionA"]), q(x["optionB"]), q(x["optionC"]), q(x["optionD"]),
            q(x["optionE"]), q(x["correctAnswer"]), q(x["explanation"])]
    rows.append("    (" + ", ".join(vals) + ")")

sections = ",\n".join(
    f"    (v_test, {set_no}, {q(s['subject'])}, {s['sectionOrder']}, {s['durationMinutes']})" for s in d["sections"])
counts = {s: sum(x["subject"] == s for x in d["questions"]) for s in ("ENGLISH", "MATHS", "VERBAL", "NON_VERBAL")}

sql = f"""-- {paper['name']} · Set {set_no} · {paper['stage']}: paper, sections, passage and questions.
-- Generated from {src.name} by json_to_sql.py - edit the JSON, not this file.
--
--   Questions: English {counts['ENGLISH']}, Maths {counts['MATHS']}, Verbal {counts['VERBAL']}, Non-Verbal {counts['NON_VERBAL']}.
--   The paper is created NOT approved (students cannot see it) and opens today
--   for 7 days; the admin sets the real dates and approves it later.
--
-- Insert only. Safe to run again: reuses the paper by name and skips the set
-- if it is already loaded. Needs migration 050 first.
--
-- Run once:  npx prisma db execute --file prisma/sql/{out.name} --schema prisma/schema.prisma

DO $do$
DECLARE
    v_test BIGINT;
    v_comp BIGINT;
BEGIN
    SELECT "id" INTO v_test
      FROM public."mockTestGs"
     WHERE "name" = {q(paper['name'])} AND "programmeCode" = {q(paper['programmeCode'])}
     ORDER BY "id" LIMIT 1;

    IF v_test IS NULL THEN
        INSERT INTO public."mockTestGs" ("name", "stage", "programmeCode", "testDate", "availableDays", "breakMinutes", "approvedByAdmin")
        VALUES ({q(paper['name'])}, {q(paper['stage'])}, {q(paper['programmeCode'])}, CURRENT_DATE, 7, 15, FALSE)
        RETURNING "id" INTO v_test;
    END IF;

    IF EXISTS (SELECT 1 FROM public."mockTestGsSection" WHERE "testId" = v_test AND "setNo" = {set_no}) THEN
        RAISE NOTICE '{paper['name']} set {set_no} is already loaded (paper id %); nothing inserted.', v_test;
        RETURN;
    END IF;

    INSERT INTO public."mockTestGsSection" ("testId", "setNo", "subject", "sectionOrder", "durationMinutes")
    VALUES
{sections};

    INSERT INTO public."mockTestGsComp" ("testId", "setNo", "label", "compStory")
    VALUES (v_test, {set_no}, {q(d['comp']['label'])}, {q(d['comp']['compStory'])})
    RETURNING "id" INTO v_comp;

    INSERT INTO public."mockTestGsQuestion" ({", ".join(cols)})
    VALUES
{(","+chr(10)).join(rows)};

    RAISE NOTICE '{paper['name']} set {set_no} loaded into paper id %: {len(rows)} questions.', v_test;
END
$do$;

-- Check what was loaded:
-- SELECT "subject", count(*) FROM public."mockTestGsQuestion" q
--   JOIN public."mockTestGs" t ON t."id" = q."testId"
--  WHERE t."name" = {q(paper['name'])} AND q."setNo" = {set_no} GROUP BY "subject";
"""
out.write_text(sql, encoding="utf-8")
print(out, len(rows), "questions", counts)
