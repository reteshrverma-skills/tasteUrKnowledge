"""Shared helpers for building mock-test sets: question list, SVG drawing,
checks (the rules in migration 050) and output (JSON + HTML preview)."""
import html as H
import json, math, random, re
from pathlib import Path

LET = "ABCDE"
INK, GREY, WHITE = "#1f2937", "#9ca3af", "#ffffff"
SUBJECTS = ("ENGLISH", "MATHS", "VERBAL", "NON_VERBAL")


class MockSet:
    def __init__(self, seed):
        self.rng = random.Random(seed)
        self.questions = []

    def add(self, subject, topic, sub, qtype, quest, answer, distractors, explanation,
            stem=None, option_format="text", shuffle=True):
        opts = [answer] + list(distractors)
        assert len(opts) == 5, (quest, len(opts))
        assert len(set(opts)) == 5, ("duplicate options", quest, opts)
        if shuffle:
            self.rng.shuffle(opts)
        order = sum(1 for q in self.questions if q["subject"] == subject) + 1
        self.questions.append({
            "subject": subject, "questionOrder": order, "topic": topic, "subTopic": sub,
            "typeOfQuestion": qtype, "quest": quest,
            "stemFormat": "svg" if stem else "none", "stemFigure": stem, "optionFormat": option_format,
            **{f"option{LET[i]}": o for i, o in enumerate(opts)},
            "correctAnswer": LET[opts.index(answer)], "explanation": explanation,
        })

    def letters_question(self, topic, sub, qtype, quest, answer_letter, explanation, subject="VERBAL"):
        """Options are the letters A-E themselves, in order, so text matches label."""
        self.add(subject, topic, sub, qtype, quest, answer_letter,
                 [l for l in LET if l != answer_letter], explanation, shuffle=False)
        self.questions[-1].update({f"option{l}": l for l in LET}, correctAnswer=answer_letter)

    # ------------------------------------------------------------------
    def check(self, story, words_range=(650, 900)):
        count = {s: sum(q["subject"] == s for q in self.questions) for s in SUBJECTS}
        assert 15 <= count["ENGLISH"] <= 20, count
        # Non-Verbal is sat as 3 parts of 8 (migration 058).
        assert count["MATHS"] == count["VERBAL"] == 20 and count["NON_VERBAL"] == 24, count
        bad = re.compile(r"<script|<foreignObject|<use\b|<animate|<set\b|javascript:|\bon[a-z]+\s*=", re.I)
        allowed = re.compile(r"^(svg|g|path|rect|circle|ellipse|line|polyline|polygon|text|tspan|defs|marker|title|desc)$", re.I)
        for q in self.questions:
            blob = (q["stemFigure"] or "") + "".join(q[f"option{l}"] or "" for l in LET)
            assert not bad.search(blob), q["quest"]
            for tag in re.findall(r"</?([a-zA-Z][\w:-]*)", blob):
                assert allowed.match(tag), (tag, q["quest"])
            assert q["correctAnswer"] in LET
        words = len(story.split())
        assert words_range[0] <= words <= words_range[1], words
        return count, words

    def write(self, out_dir, slug, paper, set_no, sections, title, story, heading):
        count, words = self.check(story)
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        data = {"paper": paper, "setNo": set_no, "sections": sections,
                "comp": {"label": title, "compStory": story}, "questions": self.questions}
        (out_dir / f"{slug}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        (out_dir / f"{slug}-preview.html").write_text(self._preview(heading, title, story, count, words), encoding="utf-8")
        dist = {l: sum(q["correctAnswer"] == l for q in self.questions) for l in LET}
        print("questions", count, "passage words", words, "answer spread", dist)

    def _preview(self, heading, title, story, count, words):
        names = {"ENGLISH": "English", "MATHS": "Maths", "VERBAL": "Verbal Reasoning", "NON_VERBAL": "Non-Verbal Reasoning"}
        parts = [f"<h1>{H.escape(heading)}</h1><p class=meta>English {count['ENGLISH']} · Maths 20 · Verbal 20 · "
                 f"Non-Verbal 24 (3 parts of 8) · passage {words} words · answer key highlighted</p>"]
        current = None
        for q in self.questions:
            if q["subject"] != current:
                current = q["subject"]
                parts.append(f"<h2>{names[current]}</h2>")
                if current == "ENGLISH":
                    parts.append(f"<article><h3>{H.escape(title)}</h3>"
                                 + "".join(f"<p>{H.escape(p)}</p>" for p in story.split("\n\n")) + "</article>")
            opts = "".join(
                f'<li class="{"ok" if l == q["correctAnswer"] else ""}"><b>{l}</b> '
                f'{q[f"option{l}"] if q["optionFormat"] == "svg" else H.escape(q[f"option{l}"])}</li>' for l in LET)
            parts.append(
                f'<section><p class=q><b>{q["questionOrder"]}.</b> {H.escape(q["quest"]).replace(chr(10), "<br>")}'
                f' <span class=tag>{H.escape(q["typeOfQuestion"])}</span></p>'
                + (f'<div class=stem>{q["stemFigure"]}</div>' if q["stemFigure"] else "")
                + f'<ol class="opts {q["optionFormat"]}">{opts}</ol>'
                f'<p class=ex>Answer {q["correctAnswer"]}: {H.escape(q["explanation"])}</p></section>')
        css = """body{font-family:system-ui,sans-serif;max-width:960px;margin:24px auto;padding:0 16px;color:#1f2937;background:#f8fafc}
h2{margin-top:36px;border-bottom:2px solid #0e7490;padding-bottom:4px}article{background:#fff;padding:16px 20px;border-radius:10px;line-height:1.6}
section{background:#fff;border-radius:10px;padding:12px 16px;margin:12px 0}.q{margin:0 0 8px}.tag{font-size:12px;color:#0e7490;background:#ecfeff;border-radius:99px;padding:1px 8px}
.stem{margin:8px 0;overflow-x:auto}.opts{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}.opts li{border:1px solid #cbd5e1;border-radius:8px;padding:6px 10px;display:flex;align-items:center;gap:8px}
.opts.text li{flex-basis:100%}.opts li.ok{border:2px solid #15803d;background:#f0fdf4}.ex{font-size:13px;color:#475569;margin:6px 0 0}.meta{color:#475569}"""
        return f"<!doctype html><meta charset=utf-8><title>{H.escape(heading)}</title><style>{css}</style>" + "".join(parts)


# ----------------------------------------------------------------------
# SVG drawing
# ----------------------------------------------------------------------
def svg(inner, w=80, h=80):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{inner}</svg>'

opt = svg

def poly_pts(n, cx=40, cy=40, r=24, rot=-90):
    return " ".join(f"{cx + r * math.cos(math.radians(rot + 360 * i / n)):.1f},"
                    f"{cy + r * math.sin(math.radians(rot + 360 * i / n)):.1f}" for i in range(n))

SIDES = {"triangle": 3, "square": 4, "pentagon": 5, "hexagon": 6, "heptagon": 7, "octagon": 8}

def shape(kind, fill=WHITE, cx=40, cy=40, r=24, rot=None):
    if kind == "circle":
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{INK}" stroke-width="2"/>'
    n = SIDES[kind]
    base = -45 if n == 4 else -90
    return f'<polygon points="{poly_pts(n, cx, cy, r, base if rot is None else rot)}" fill="{fill}" stroke="{INK}" stroke-width="2"/>'

def dots(n, cx=40, cy=40, r=3, gap=10, cols=None, fill=INK):
    cols = cols or min(n, 4)
    rows = math.ceil(n / cols)
    out = []
    for i in range(n):
        row, col = divmod(i, cols)
        in_row = min(cols, n - row * cols)
        x = cx + (col - (in_row - 1) / 2) * gap
        y = cy + (row - (rows - 1) / 2) * gap
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill}"/>')
    return "".join(out)

def arrow(a, fill=INK):
    return (f'<polygon points="37,62 43,62 43,32 52,32 40,16 28,32 37,32" fill="{fill}" stroke="{INK}" '
            f'stroke-width="1.5" transform="rotate({a} 40 40)"/>')

def tf(inner, t):
    return f'<g transform="{t}">{inner}</g>'

HFLIP, VFLIP = "translate(80,0) scale(-1,1)", "translate(0,80) scale(1,-1)"
QMARK = '<text x="40" y="52" font-size="32" text-anchor="middle" fill="#6b7280">?</text>'
BOX = f'<rect x="0" y="0" width="80" height="80" rx="6" fill="{WHITE}" stroke="{GREY}" stroke-width="1.5"/>'

def frame_strip(cells, question=True):
    cells = list(cells) + (["?"] if question else [])
    out = [f'<g transform="translate({i * 90 + 5},5)">{BOX}{QMARK if c == "?" else c}</g>' for i, c in enumerate(cells)]
    return svg("".join(out), len(cells) * 90, 90)

def analogy(a, b, c):
    out = [f'<g transform="translate({x},5)">{BOX}{inner if inner else QMARK}</g>'
           for x, inner in [(5, a), (125, b), (245, c), (365, None)]]
    out.append('<text x="105" y="52" font-size="22" text-anchor="middle" fill="#6b7280">→</text>')
    out.append('<text x="225" y="52" font-size="18" text-anchor="middle" fill="#6b7280">as</text>')
    out.append('<text x="345" y="52" font-size="22" text-anchor="middle" fill="#6b7280">→</text>')
    return svg("".join(out), 450, 90)

def matrix(cells, n):
    out = []
    for i, c in enumerate(list(cells) + ["?"]):
        r, col = divmod(i, n)
        out.append(f'<g transform="translate({5 + col * 88},{5 + r * 88})">{BOX}{QMARK if c == "?" else c}</g>')
    return svg("".join(out), n * 88 + 2, n * 88 + 2)

def code_stem(examples, target):
    out = []
    items = [e for e, _ in examples] + [target]
    for i, inner in enumerate(items):
        x = 5 + i * 90
        out.append(f'<g transform="translate({x},5)">{BOX}{inner}</g>')
        label = examples[i][1] if i < len(examples) else "?"
        out.append(f'<text x="{x + 40}" y="104" font-size="16" font-weight="bold" text-anchor="middle" fill="{INK}">{label}</text>')
    return svg("".join(out), len(items) * 90, 112)

def mirror_stem(inner):
    """Figure with a vertical dashed mirror line to its right."""
    return svg(f'<g transform="translate(5,5)">{inner}</g><line x1="92" y1="4" x2="92" y2="86" '
               f'stroke="{INK}" stroke-width="2" stroke-dasharray="5,4"/>', 100, 90)

def hmirror_stem(inner):
    """Figure with a horizontal dashed mirror line below it."""
    return svg(f'<g transform="translate(5,5)">{inner}</g><line x1="4" y1="92" x2="86" y2="92" '
               f'stroke="{INK}" stroke-width="2" stroke-dasharray="5,4"/>', 90, 100)
