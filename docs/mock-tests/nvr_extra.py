"""Question builders for the 4 extra Non-Verbal questions each set needs now
that Non-Verbal is sat as 3 parts of 8 (migration 058: 24 per set).

Each builder returns the keyword arguments for MockSet.add, so a set script
can do  S.add(**q)  and the usual checks (5 different options, safe SVG)
still run. Every figure is drawn from its rule; cube answers are checked by
folding the net in code. All content is original to this project.
"""
from mock_lib import INK, GREY, WHITE, BOX, svg, opt, shape, arrow, tf, HFLIP, VFLIP, frame_strip
from mock2_lib import LIGHT, paper, dashed, hole, curl, fold_stem, unfolded, rot
from mock3_lib import (cube_dirs, valid_view, net_sym, cube3d, outline, lines, place, mirror_pts, turn_pts,
                       strip_gap, row_of, VEC)
from mock2_lib import net, cube_opposites

N = "NON_VERBAL"


def _q(topic, sub, qtype, quest, stem, answer, distractors, explanation, option_format="svg"):
    return dict(subject=N, topic=topic, sub=sub, qtype=qtype, quest=quest, answer=answer,
                distractors=distractors, explanation=explanation, stem=stem, option_format=option_format)


# ----------------------------------------------------------------------
def cube_opposite(cells, ask):
    """Text options: which face is opposite `ask`? cells use mock2_lib symbols."""
    names = {"black": "The black square", "circle": "The circle", "cross": "The cross", "dot": "The dot",
             "triangle": "The triangle", "stripes": "The stripes", "diamond": "The diamond"}
    opp = cube_opposites(cells)
    others = [names[k] for k in cells.values() if k not in (ask, opp[ask])]
    return _q("Cubes", "Nets", "cube net", f"This net is folded to make a cube. Which face is opposite {names[ask].lower()}?",
              net(cells), names[opp[ask]], others,
              f"Faces that are opposite never share an edge when the cube is folded. Folding the net puts {names[opp[ask]].lower()} "
              f"on the side facing away from {names[ask].lower()}; every other face touches it.", option_format="text")


def cube_view(cells, pick=0):
    """Which cube could be made from the net? Symbols must be from mock3_lib.SYMMETRIC."""
    d = cube_dirs(cells)
    syms = list(cells.values())
    opp = lambda a, b: tuple(-x for x in VEC[d[a]]) == VEC[d[b]]
    triples = [(t, f, r) for t in syms for f in syms for r in syms if len({t, f, r}) == 3]
    good = [v for v in triples if valid_view(d, *v)]
    mirror = [v for v in triples if not valid_view(d, *v) and not any(opp(a, b) for a in v for b in v if a != b)]
    clash = [v for v in triples if any(opp(a, b) for a in v for b in v if a != b)]
    right = good[pick % len(good)]
    wrong = [mirror[(pick * 7 + 3) % len(mirror)], mirror[(pick * 5 + 11) % len(mirror)],
             clash[(pick * 3 + 1) % len(clash)], clash[(pick * 11 + 17) % len(clash)]]
    assert len(set(wrong)) == 4 and right not in wrong
    return _q("Cubes", "Nets to cubes", "cube net", "Which cube could be made by folding this net?",
              net_sym(cells), opt(cube3d(*right)), [opt(cube3d(*v)) for v in wrong],
              "Two options show a pair of faces that are opposite each other, which can never be seen together. "
              "Two more show three faces that could meet, but in the mirror-image order round the corner.")


def hidden(target, extra, dx=26, dy=26):
    """Target must not look the same turned half way round or reflected."""
    t2 = turn_pts(target, 2)
    m = mirror_pts(target)
    return _q("Hidden shapes", "Find the shape", "hidden shape",
              "In which option is the shape on the left hidden? It must be the same size and the same way round.",
              row_of([outline(place(target, 26, 26), 2.5)]),
              opt(outline(place(target, dx, dy)) + lines(extra)),
              [opt(outline(place(m, dx, dy)) + lines(extra)), opt(outline(place(turn_pts(target, 1), dx, dy)) + lines(extra)),
               opt(outline(place(t2, dx, dy)) + lines(extra)),
               opt(outline(place([(x * 1.4, y * 1.4) for x, y in target], dx - 6, dy - 6)) + lines(extra))],
              "The shape must be found exactly as it is: the same size, not turned and not reflected. "
              "The other options hide a mirror image, a turned copy or a bigger copy.")


def symmetry(left):
    """left: black cells (col 0-1, row 0-3) of the left half of a 4 x 4 grid."""
    def half(cells):
        return "".join(f'<rect x="{24 + c * 16}" y="{8 + r * 16}" width="16" height="16" fill="{INK if (c, r) in cells else WHITE}" '
                       f'stroke="{GREY}" stroke-width="1.5"/>' for c in range(2) for r in range(4))
    out = []
    for c in range(4):
        for r in range(4):
            fill = INK if c < 2 and (c, r) in left else (WHITE if c < 2 else "#f3f4f6")
            out.append(f'<rect x="{10 + c * 18}" y="{8 + r * 18}" width="18" height="18" fill="{fill}" stroke="{GREY}" stroke-width="1.5"/>')
    out.append(f'<line x1="46" y1="2" x2="46" y2="86" stroke="{INK}" stroke-width="2" stroke-dasharray="5,4"/>')
    out.append('<text x="73" y="50" font-size="22" text-anchor="middle" fill="#6b7280">?</text>')
    stem = svg("".join(out), 92, 90)
    right = {(1 - c, r) for c, r in left}
    flip = {(1 - c, 3 - r) for c, r in left}
    one_less = set(right) - {sorted(right)[0]}
    spare = next((c, r) for r in range(4) for c in range(2) if (c, r) not in right)
    one_more = set(right) | {spare}
    choices = [set(left), flip, one_less, one_more]
    assert len({frozenset(x) for x in [right] + choices}) == 5
    return _q("Symmetry", "Complete the pattern", "symmetry",
              "Which option completes the pattern so that it is symmetrical about the dashed line?",
              stem, opt(half(right)), [opt(half(x)) for x in choices],
              "The right half must be the mirror image of the left: each black square is the same distance from the dashed line on the other side.")


def missing_middle(frames, distractors, explanation):
    return _q("Sequences", "Missing middle", "sequence", "Which figure is missing from the middle of the sequence?",
              strip_gap(frames, 2), opt(frames[2]), [opt(x) for x in distractors], explanation)


def overlay(fa, fb, part_of_b):
    """part_of_b: fb with something left out (a near-miss option)."""
    return _q("Combining", "Overlay", "combining figures",
              "Which option shows the first two figures placed exactly on top of each other?",
              row_of([fa, fb]), opt(fa + fb),
              [opt(fa + tf(fb, HFLIP)), opt(fa + part_of_b), opt(tf(fa, VFLIP) + fb), opt(fa + rot(fb, 90))],
              "Everything from both figures appears, in exactly the same place and the same way round.")


def fold_over(parts):
    """parts: marks drawn in the left half (x 8-40) of the sheet."""
    pat = "".join(parts)
    sheet = f'<rect x="8" y="8" width="64" height="64" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
    line = f'<line x1="40" y1="4" x2="40" y2="76" stroke="{INK}" stroke-width="2" stroke-dasharray="5,4"/>'
    folded = lambda p: f'<rect x="40" y="8" width="32" height="64" fill="{LIGHT}" stroke="{INK}" stroke-width="2"/>' + p
    return _q("Folding", "Fold over", "paper folding",
              "The paper is see-through. It is folded along the dashed line so that the left half lies on top of the right half. What does it look like?",
              row_of([sheet + line + pat]), opt(folded(tf(pat, HFLIP))),
              [opt(folded(tf(pat, "translate(32,0)"))), opt(folded(tf(tf(pat, HFLIP), VFLIP))),
               opt(sheet + line + pat + tf(pat, HFLIP)), opt(folded(tf("".join(parts[1:]), HFLIP)))],
              "Folding works like a mirror: every mark lands the same distance from the fold, on the other side.")


def fold_punch(holes):
    """One fold, right half onto left; holes are punched in the left half (x 10-40)."""
    ans = sorted(set(holes) | {(80 - x, y) for x, y in holes})
    steps = [paper(10, 10, 60, 60) + dashed(40, 6, 40, 74) + curl(62, 30, 22, 30),
             paper(10, 10, 30, 60) + "".join(hole(x, y) for x, y in holes)]
    w = [sorted(holes), sorted(set(holes) | {(x, 80 - y) for x, y in holes}),
         sorted(set(holes) | {(80 - x, 80 - y) for x, y in holes}), sorted(set(ans) - {ans[-1]})]
    assert len({tuple(ans)} | {tuple(x) for x in w}) == 5
    return _q("Folding", "Fold and punch", "paper folding",
              "A square of paper is folded in half from right to left and holes are punched through it. What does it look like when it is unfolded?",
              fold_stem(steps), opt(unfolded(ans)), [opt(unfolded(x)) for x in w],
              "Each hole goes through both layers. When the paper is opened, each hole has a partner reflected in the fold line.")


def turning_arrow(start, step, fills, explanation):
    """Arrow turns `step` degrees each time; shading repeats `fills`."""
    fr = [arrow((start + step * k) % 360, fills[k % len(fills)]) for k in range(5)]
    a4, f4 = (start + step * 4) % 360, fills[4 % len(fills)]
    other_fill = next(f for f in (INK, GREY, WHITE) if f != f4)
    wrong = [arrow(a4, other_fill), arrow((a4 + step) % 360, f4), arrow((a4 - 2 * step) % 360, f4), arrow((a4 + 180) % 360, other_fill)]
    return _q("Sequences", "Two rules", "sequence", "Which figure comes next in the sequence?",
              frame_strip(fr[:4]), opt(fr[4]), [opt(x) for x in wrong], explanation)
