"""Non-Verbal questions 21-24 for both sets of Mock Test 1, needed once
Non-Verbal became 3 parts of 8 questions (migration 058). Original content;
no question type repeats one already in that set.

Writes mock-test-1-nvr-extra.json (for review) and the insert script
prisma/sql/059_mock_test_1_nvr_extra.sql.

Usage:  python -I docs/mock-tests/build_mock1_nvr_extra.py docs/mock-tests prisma/sql
"""
import html as H, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pathlib import Path
from mock_lib import MockSet, INK, GREY, WHITE, LET
from mock3_lib import lines
from nvr_extra import cube_opposite, hidden, symmetry, missing_middle, cube_view, fold_punch, overlay, fold_over

PAPER = "Mock Test 1"
FIRST_ORDER = 21


def spokes(n, turn=0, dot=False):
    import math
    out = f'<circle cx="40" cy="40" r="28" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
    for i in range(n):
        a = math.radians(turn - 90 + 360 * i / n)
        out += f'<line x1="40" y1="40" x2="{40 + 26 * math.cos(a):.1f}" y2="{40 + 26 * math.sin(a):.1f}" stroke="{INK}" stroke-width="2.5"/>'
    return out + (f'<circle cx="40" cy="40" r="4" fill="{INK}"/>' if dot else "")


def set1(S):
    S.add(**cube_opposite({(0, 2): "dot", (1, 0): "cross", (1, 1): "circle", (1, 2): "black", (1, 3): "triangle", (2, 1): "stripes"}, "circle"))
    S.add(**hidden([(0, 0), (22, 0), (22, 8), (8, 8), (8, 14), (18, 14), (18, 22), (8, 22), (8, 32), (0, 32)],
                   [(10, 20, 70, 20), (40, 10, 40, 70), (12, 50, 68, 50), (14, 70, 70, 14), (60, 30, 60, 66)]))
    S.add(**symmetry({(0, 0), (1, 0), (0, 1), (1, 2), (1, 3)}))
    S.add(**missing_middle([spokes(k + 2) for k in range(5)], [spokes(3), spokes(5), spokes(4, 45), spokes(4, 0, True)],
                           "Each figure has one more line from the centre than the one before: 2, 3, 4, 5, 6. The middle figure has 4 lines, starting straight up."))


def set2(S):
    S.add(**cube_view({(0, 0): "circle", (0, 1): "black", (0, 2): "dot", (1, 1): "cross", (2, 1): "grey", (3, 1): "diamond"}, pick=0))
    S.add(**fold_punch([(20, 24), (30, 52)]))
    fa = lines([(14, 26, 66, 26)]) + f'<rect x="16" y="46" width="14" height="14" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
    fb_dot = f'<circle cx="58" cy="54" r="6" fill="{INK}"/>'
    fb = fb_dot + lines([(40, 14, 40, 40)])
    S.add(**overlay(fa, fb, fb_dot))
    S.add(**fold_over([f'<circle cx="26" cy="22" r="7" fill="{GREY}" stroke="{INK}" stroke-width="1.5"/>',
                       f'<rect x="12" y="44" width="10" height="18" fill="{INK}"/>',
                       f'<line x1="16" y1="66" x2="36" y2="66" stroke="{INK}" stroke-width="3"/>']))


def q(v):
    if v is None:
        return "NULL"
    s = str(v)
    assert "$q$" not in s
    return f"$q${s}$q$"


def main(out_dir, sql_dir):
    out = {}
    for set_no, build, seed in ((1, set1, 20261126), (2, set2, 20261127)):
        S = MockSet(seed=seed)
        build(S)
        for i, x in enumerate(S.questions):
            x["questionOrder"] = FIRST_ORDER + i
        assert len(S.questions) == 4 and all(x["subject"] == "NON_VERBAL" for x in S.questions)
        out[set_no] = S.questions
    Path(out_dir, "mock-test-1-nvr-extra.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    # Preview for review (answers highlighted)
    parts = ["<!doctype html><meta charset=utf-8><title>Mock Test 1 NVR 21-24</title><style>body{font-family:sans-serif;max-width:960px;margin:20px auto}"
             "section{border-bottom:1px solid #ccc;padding:8px}.o{display:inline-block;border:1px solid #999;margin:3px;padding:3px}.ok{border:3px solid green}</style>"]
    for set_no, qs in out.items():
        parts.append(f"<h2>Set {set_no}</h2>")
        for x in qs:
            opts = "".join(f'<span class="o{" ok" if l == x["correctAnswer"] else ""}"><b>{l}</b> '
                           f'{x["option" + l] if x["optionFormat"] == "svg" else H.escape(x["option" + l])}</span>' for l in LET)
            parts.append(f'<section><p>{x["questionOrder"]}. {H.escape(x["quest"])}</p>{x["stemFigure"] or ""}<div>{opts}</div>'
                         f'<p><i>{H.escape(x["explanation"])}</i></p></section>')
    Path(out_dir, "mock-test-1-nvr-extra-preview.html").write_text("".join(parts), encoding="utf-8")

    cols = ['"testId"', '"setNo"', '"subject"', '"part"', '"compId"', '"questionOrder"', '"topic"', '"subTopic"',
            '"typeOfQuestion"', '"quest"', '"stemFormat"', '"stemFigure"', '"optionFormat"',
            '"optionA"', '"optionB"', '"optionC"', '"optionD"', '"optionE"', '"correctAnswer"', '"explanation"']
    blocks = []
    for set_no, qs in out.items():
        for x in qs:
            vals = ["v_test", str(set_no), q("NON_VERBAL"), "3", "NULL", str(x["questionOrder"]), q(x["topic"]), q(x["subTopic"]),
                    q(x["typeOfQuestion"]), q(x["quest"]), q(x["stemFormat"]), q(x["stemFigure"]), q(x["optionFormat"]),
                    q(x["optionA"]), q(x["optionB"]), q(x["optionC"]), q(x["optionD"]), q(x["optionE"]), q(x["correctAnswer"]),
                    q(x["explanation"])]
            blocks.append(f"""    INSERT INTO public."mockTestGsQuestion" ({", ".join(cols)})
    SELECT {", ".join(vals)}
     WHERE NOT EXISTS (SELECT 1 FROM public."mockTestGsQuestion"
                        WHERE "testId" = v_test AND "setNo" = {set_no} AND "subject" = 'NON_VERBAL' AND "questionOrder" = {x["questionOrder"]});""")
    sql = f"""-- {PAPER}: Non-Verbal questions 21-24 for Set 1 and Set 2 (part 3).
-- Generated by docs/mock-tests/build_mock1_nvr_extra.py - edit that, not this file.
--
-- Migration 058 splits Non-Verbal into 3 parts of 8 questions, so each set
-- needs 24. Mock Test 1 was loaded with 20; this adds the last 4 of each set.
-- Students who already sat Mock Test 1 keep their marks unchanged.
--
-- Insert only. Safe to run again: a question already present is skipped.
-- Needs migration 058 first.
--
-- Run once:  npx prisma db execute --file prisma/sql/059_mock_test_1_nvr_extra.sql --schema prisma/schema.prisma

DO $do$
DECLARE
    v_test BIGINT;
BEGIN
    SELECT "id" INTO v_test FROM public."mockTestGs"
     WHERE "name" = {q(PAPER)} AND "programmeCode" = 'GRAMMAR' ORDER BY "id" LIMIT 1;
    IF v_test IS NULL THEN
        RAISE NOTICE '{PAPER} is not loaded; nothing inserted.';
        RETURN;
    END IF;

{chr(10).join(blocks)}

    RAISE NOTICE '{PAPER} (paper id %): Non-Verbal questions 21-24 present in both sets.', v_test;
END
$do$;

-- Check: each set should have 8 Non-Verbal questions in each of parts 1-3.
-- SELECT "setNo", "part", count(*) FROM public."mockTestGsQuestion" q JOIN public."mockTestGs" t ON t."id" = q."testId"
--  WHERE t."name" = {q(PAPER)} AND q."subject" = 'NON_VERBAL' GROUP BY 1, 2 ORDER BY 1, 2;
"""
    Path(sql_dir, "059_mock_test_1_nvr_extra.sql").write_text(sql, encoding="utf-8")
    print("wrote", len(out[1]) + len(out[2]), "questions")


main(sys.argv[1], sys.argv[2])
