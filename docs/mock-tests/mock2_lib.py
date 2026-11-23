"""Extra drawing helpers for Mock Test 2 (harder Non-Verbal types).

Everything here builds on mock_lib: plain shapes, lines and paths only, so the
figures pass sanitiseFigure and the checks in MockSet.check.
"""
import math
from mock_lib import INK, GREY, WHITE, svg, shape, dots, tf, BOX

LIGHT = "#e5e7eb"


def _pt(cx, cy, r, deg):
    a = math.radians(deg)
    return cx + r * math.cos(a), cy + r * math.sin(a)


def wheel(fills, cx=40, cy=40, r=28, start=-90):
    """A circle cut into len(fills) equal sectors, filled clockwise from the top."""
    n = len(fills)
    out = []
    for i, f in enumerate(fills):
        x1, y1 = _pt(cx, cy, r, start + 360 * i / n)
        x2, y2 = _pt(cx, cy, r, start + 360 * (i + 1) / n)
        out.append(f'<path d="M{cx},{cy} L{x1:.1f},{y1:.1f} A{r},{r} 0 0 1 {x2:.1f},{y2:.1f} Z" '
                   f'fill="{f}" stroke="{INK}" stroke-width="1.5"/>')
    return "".join(out)


def poly_wheel(fills, cx=40, cy=40, r=28):
    """A regular polygon with len(fills) sides cut into triangles from the centre."""
    n = len(fills)
    start = -90 - 180 / n if n % 2 == 0 else -90
    out = []
    for i, f in enumerate(fills):
        x1, y1 = _pt(cx, cy, r, start + 360 * i / n)
        x2, y2 = _pt(cx, cy, r, start + 360 * (i + 1) / n)
        out.append(f'<polygon points="{cx},{cy} {x1:.1f},{y1:.1f} {x2:.1f},{y2:.1f}" '
                   f'fill="{f}" stroke="{INK}" stroke-width="1.5"/>')
    return "".join(out)


# 3 x 3 grid, ring positions clockwise from the top-left corner.
RING = [0, 1, 2, 5, 8, 7, 6, 3]


def grid3(black=(), circles=(), size=18, x0=13, y0=13):
    out = []
    for i in range(9):
        r, c = divmod(i, 3)
        out.append(f'<rect x="{x0 + c * size}" y="{y0 + r * size}" width="{size}" height="{size}" '
                   f'fill="{INK if i in black else WHITE}" stroke="{GREY}" stroke-width="1.5"/>')
    for i in circles:
        r, c = divmod(i, 3)
        out.append(f'<circle cx="{x0 + c * size + size / 2}" cy="{y0 + r * size + size / 2}" r="{size / 3}" '
                   f'fill="{GREY}" stroke="{INK}" stroke-width="1.5"/>')
    return "".join(out)


def small_arrow(cx, cy, ang, s=0.45, fill=INK):
    """mock_lib's arrow shrunk and centred on (cx, cy), pointing at ang degrees (0 = up)."""
    return (f'<g transform="translate({cx},{cy}) rotate({ang}) scale({s}) translate(-40,-40)">'
            f'<polygon points="37,62 43,62 43,32 52,32 40,16 28,32 37,32" fill="{fill}" stroke="{INK}" stroke-width="2"/></g>')


# Line pieces used by overlay matrices.
SEGMENTS = {
    "V": '<line x1="40" y1="12" x2="40" y2="68" stroke="{c}" stroke-width="3"/>',
    "H": '<line x1="12" y1="40" x2="68" y2="40" stroke="{c}" stroke-width="3"/>',
    "D1": '<line x1="16" y1="16" x2="64" y2="64" stroke="{c}" stroke-width="3"/>',
    "D2": '<line x1="64" y1="16" x2="16" y2="64" stroke="{c}" stroke-width="3"/>',
    "O": '<circle cx="40" cy="40" r="10" fill="none" stroke="{c}" stroke-width="3"/>',
    "T": '<line x1="14" y1="14" x2="66" y2="14" stroke="{c}" stroke-width="3"/>',
}


def segs(parts):
    order = ["T", "V", "H", "D1", "D2", "O"]
    return "".join(SEGMENTS[p].format(c=INK) for p in order if p in parts)


def hand_clock(long_a, short_a):
    """A clock face with a long and a short hand (angles in degrees, 0 = up)."""
    return (shape("circle", r=28)
            + f'<line x1="40" y1="40" x2="40" y2="15" stroke="{INK}" stroke-width="2.5" stroke-linecap="round" transform="rotate({long_a} 40 40)"/>'
            + f'<line x1="40" y1="40" x2="40" y2="26" stroke="{INK}" stroke-width="5" stroke-linecap="round" transform="rotate({short_a} 40 40)"/>'
            + f'<circle cx="40" cy="40" r="3" fill="{INK}"/>')


# ----------------------------------------------------------------------
# Folding and punching. The paper is the square (10,10)-(70,70).
# ----------------------------------------------------------------------
def hole(x, y, r=4.5):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{WHITE}" stroke="{INK}" stroke-width="1.5"/>'


def paper(x, y, w, h, fill=LIGHT):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{INK}" stroke-width="2"/>'


def dashed(x1, y1, x2, y2):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{INK}" stroke-width="1.5" stroke-dasharray="4,3"/>'


def unfolded(holes):
    return paper(10, 10, 60, 60) + "".join(hole(x, y) for x, y in holes)


def fold_stem(steps):
    """steps: list of inner figures (80 x 80) shown left to right with arrows between."""
    out = []
    for i, inner in enumerate(steps):
        x = 5 + i * 110
        out.append(f'<g transform="translate({x},5)">{BOX}{inner}</g>')
        if i < len(steps) - 1:
            out.append(f'<text x="{x + 95}" y="52" font-size="22" text-anchor="middle" fill="#6b7280">→</text>')
    return svg("".join(out), len(steps) * 110 - 20, 90)


def curl(x1, y1, x2, y2):
    """A curved arrow showing which way the paper folds."""
    mx, my = (x1 + x2) / 2, min(y1, y2) - 12 if y1 == y2 else (y1 + y2) / 2
    if x1 == x2:
        mx, my = x1 + 14, (y1 + y2) / 2
    return (f'<path d="M{x1},{y1} Q{mx},{my} {x2},{y2}" fill="none" stroke="{INK}" stroke-width="1.5"/>'
            f'<circle cx="{x2}" cy="{y2}" r="2.5" fill="{INK}"/>')


# ----------------------------------------------------------------------
# Cube nets
# ----------------------------------------------------------------------
def face_symbol(name, x, y, s=20):
    cx, cy = x + s / 2, y + s / 2
    if name == "black":
        return f'<rect x="{x + 2}" y="{y + 2}" width="{s - 4}" height="{s - 4}" fill="{INK}"/>'
    if name == "circle":
        return f'<circle cx="{cx}" cy="{cy}" r="{s / 3.2:.1f}" fill="none" stroke="{INK}" stroke-width="1.8"/>'
    if name == "cross":
        k = s / 3.5
        return (f'<line x1="{cx - k}" y1="{cy - k}" x2="{cx + k}" y2="{cy + k}" stroke="{INK}" stroke-width="2"/>'
                f'<line x1="{cx + k}" y1="{cy - k}" x2="{cx - k}" y2="{cy + k}" stroke="{INK}" stroke-width="2"/>')
    if name == "dot":
        return f'<circle cx="{cx}" cy="{cy}" r="{s / 6:.1f}" fill="{INK}"/>'
    if name == "triangle":
        k = s / 3
        return f'<polygon points="{cx},{cy - k} {cx + k},{cy + k * 0.8} {cx - k},{cy + k * 0.8}" fill="{GREY}" stroke="{INK}" stroke-width="1.5"/>'
    if name == "stripes":
        return "".join(f'<line x1="{x + 4}" y1="{y + s * f}" x2="{x + s - 4}" y2="{y + s * f}" stroke="{INK}" stroke-width="1.8"/>'
                       for f in (0.3, 0.5, 0.7))
    if name == "diamond":
        k = s / 3
        return f'<polygon points="{cx},{cy - k} {cx + k},{cy} {cx},{cy + k} {cx - k},{cy}" fill="{WHITE}" stroke="{INK}" stroke-width="1.8"/>'
    raise KeyError(name)


def net(cells, s=24):
    """cells: {(row, col): symbol}. Draws the net of a cube."""
    rows = max(r for r, _ in cells) + 1
    cols = max(c for _, c in cells) + 1
    out = []
    for (r, c), name in cells.items():
        x, y = 4 + c * s, 4 + r * s
        out.append(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" fill="{WHITE}" stroke="{INK}" stroke-width="1.8"/>')
        out.append(face_symbol(name, x + 2, y + 2, s - 4))
    return svg("".join(out), cols * s + 8, rows * s + 8)


def cube_opposites(cells):
    """Opposite faces of a cube folded from a net, found by actually folding it.

    Walks the net from one face, rolling a cube; each face records which of the
    six cube directions it lands on.
    """
    start = next(iter(cells))
    # Cube orientation as a mapping of net direction -> cube face direction.
    # Directions: U(p), D(own), N(orth), S(outh), E(ast), W(est); bottom = D.
    seen = {start: "D"}
    stack = [(start, {"N": "N", "S": "S", "E": "E", "W": "W", "D": "D", "U": "U"})]
    roll = {
        # moving east: the face on the east side becomes the bottom
        (0, 1): lambda o: {**o, "D": o["E"], "E": o["U"], "U": o["W"], "W": o["D"]},
        (0, -1): lambda o: {**o, "D": o["W"], "W": o["U"], "U": o["E"], "E": o["D"]},
        (1, 0): lambda o: {**o, "D": o["S"], "S": o["U"], "U": o["N"], "N": o["D"]},
        (-1, 0): lambda o: {**o, "D": o["N"], "N": o["U"], "U": o["S"], "S": o["D"]},
    }
    while stack:
        (r, c), o = stack.pop()
        for (dr, dc), f in roll.items():
            nxt = (r + dr, c + dc)
            if nxt in cells and nxt not in seen:
                no = f(o)
                seen[nxt] = no["D"]
                stack.append((nxt, no))
    assert sorted(seen.values()) == sorted("DUNSEW"), seen  # a real cube net
    by_dir = {d: cells[p] for p, d in seen.items()}
    pair = {"U": "D", "D": "U", "N": "S", "S": "N", "E": "W", "W": "E"}
    return {by_dir[d]: by_dir[pair[d]] for d in by_dir}


# ----------------------------------------------------------------------
# Geometry helpers for checks
# ----------------------------------------------------------------------
def reflect_diag(inner):
    """Reflect in the line from top-left to bottom-right (y = x)."""
    return tf(inner, "matrix(0,1,1,0,0,0)")


def reflect_antidiag(inner):
    """Reflect in the line from top-right to bottom-left."""
    return tf(inner, "matrix(0,-1,-1,0,80,80)")


def rot(inner, a):
    return tf(inner, f"rotate({a} 40 40)")
