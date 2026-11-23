"""Drawing helpers for Mock Test 3 (new Non-Verbal types).

Builds on mock_lib and mock2_lib. All figures use plain shapes only, so they
pass sanitiseFigure and MockSet.check.
"""
from mock_lib import INK, GREY, WHITE, BOX, QMARK, svg, tf
from mock2_lib import LIGHT, paper, dashed, hole


# ----------------------------------------------------------------------
# Cubes: which cube can be folded from a net?
# ----------------------------------------------------------------------
VEC = {"U": (0, 0, 1), "D": (0, 0, -1), "N": (0, 1, 0), "S": (0, -1, 0), "E": (1, 0, 0), "W": (-1, 0, 0)}


def cube_dirs(cells):
    """Folds the net by rolling a cube over it; returns {symbol: direction}."""
    start = next(iter(cells))
    seen = {start: "D"}
    stack = [(start, {d: d for d in VEC})]
    roll = {
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
    assert sorted(seen.values()) == sorted(VEC), seen
    # Rolling stamps the cube from underneath, which is the mirror image of
    # folding the net printed side out (the start face ends up on top, not
    # underneath). Swapping up and down turns one into the other.
    flip = {"U": "D", "D": "U"}
    return {cells[p]: flip.get(d, d) for p, d in seen.items()}


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def valid_view(dirs, top, front, right):
    """True when a cube folded from the net can show these three faces as
    top, front and right. Symbols must look the same when turned (so only
    which face is where matters, not how it is turned)."""
    t, f, r = (VEC[dirs[x]] for x in (top, front, right))
    return cross(t, f) == r


SYMMETRIC = ("black", "circle", "cross", "dot", "grey", "diamond")


def sym(name, s=36):
    """A symbol drawn in the square (0,0)-(s,s); unchanged by quarter turns."""
    c = s / 2
    if name == "black":
        return f'<rect x="6" y="6" width="{s - 12}" height="{s - 12}" fill="{INK}"/>'
    if name == "grey":
        return f'<rect x="6" y="6" width="{s - 12}" height="{s - 12}" fill="{GREY}" stroke="{INK}" stroke-width="1.5"/>'
    if name == "circle":
        return f'<circle cx="{c}" cy="{c}" r="{s / 3.4:.1f}" fill="none" stroke="{INK}" stroke-width="2.5"/>'
    if name == "dot":
        return f'<circle cx="{c}" cy="{c}" r="{s / 7:.1f}" fill="{INK}"/>'
    if name == "cross":
        k = s / 3.6
        return (f'<line x1="{c - k}" y1="{c - k}" x2="{c + k}" y2="{c + k}" stroke="{INK}" stroke-width="3"/>'
                f'<line x1="{c + k}" y1="{c - k}" x2="{c - k}" y2="{c + k}" stroke="{INK}" stroke-width="3"/>')
    if name == "diamond":
        k = s / 3
        return f'<polygon points="{c},{c - k} {c + k},{c} {c},{c + k} {c - k},{c}" fill="{WHITE}" stroke="{INK}" stroke-width="2.5"/>'
    raise KeyError(name)


def net_sym(cells, s=26):
    rows = max(r for r, _ in cells) + 1
    cols = max(c for _, c in cells) + 1
    out = []
    for (r, c), name in cells.items():
        x, y = 4 + c * s, 4 + r * s
        out.append(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" fill="{WHITE}" stroke="{INK}" stroke-width="1.8"/>')
        out.append(f'<g transform="translate({x},{y}) scale({s / 36:.4f})">{sym(name)}</g>')
    return svg("".join(out), cols * s + 8, rows * s + 8)


def cube3d(top, front, right):
    """A cube drawn in an 80 x 80 box showing three faces."""
    k = 16 / 36
    faces = [
        ('14,30 50,30 66,14 30,14', f"matrix(1,0,{-k:.4f},{k:.4f},30,14)", top),
        ('14,30 50,30 50,66 14,66', "matrix(1,0,0,1,14,30)", front),
        ('50,30 66,14 66,50 50,66', f"matrix({k:.4f},{-k:.4f},0,1,50,30)", right),
    ]
    out = []
    for pts, m, name in faces:
        out.append(f'<polygon points="{pts}" fill="{WHITE}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>')
        out.append(f'<g transform="{m}">{sym(name)}</g>')
    return "".join(out)


# ----------------------------------------------------------------------
# Hidden shapes
# ----------------------------------------------------------------------
def outline(pts, width=2.2):
    return f'<polygon points="{" ".join(f"{x},{y}" for x, y in pts)}" fill="none" stroke="{INK}" stroke-width="{width}" stroke-linejoin="round"/>'


def lines(segments, width=2.2):
    return "".join(f'<line x1="{a}" y1="{b}" x2="{c}" y2="{d}" stroke="{INK}" stroke-width="{width}"/>' for a, b, c, d in segments)


def place(pts, dx, dy):
    return [(x + dx, y + dy) for x, y in pts]


def mirror_pts(pts):
    cx = (min(x for x, _ in pts) + max(x for x, _ in pts)) / 2
    return [(2 * cx - x, y) for x, y in pts]


def turn_pts(pts, quarter=1):
    """Turns points a quarter turn clockwise about their own centre."""
    cx = (min(x for x, _ in pts) + max(x for x, _ in pts)) / 2
    cy = (min(y for _, y in pts) + max(y for _, y in pts)) / 2
    out = pts
    for _ in range(quarter):
        out = [(cx - (y - cy), cy + (x - cx)) for x, y in out]
    return out


# ----------------------------------------------------------------------
# Diagonal folding. Paper is the square (10,10)-(70,70).
# Fold 1 along y = x (top-right half onto bottom-left);
# fold 2 along x + y = 80 (bottom part onto the left).
# ----------------------------------------------------------------------
def diag_unfold(holes):
    out = set()
    for x, y in holes:
        for p in [(x, y), (80 - y, 80 - x)]:
            out.add(p)
            out.add((p[1], p[0]))
    return sorted(out)


def diag_steps(holes):
    tri = lambda pts: f'<polygon points="{" ".join(f"{x},{y}" for x, y in pts)}" fill="{LIGHT}" stroke="{INK}" stroke-width="2"/>'
    return [paper(10, 10, 60, 60) + dashed(10, 10, 70, 70),
            tri([(10, 10), (10, 70), (70, 70)]) + dashed(10, 70, 40, 40),
            tri([(10, 10), (10, 70), (40, 40)]) + "".join(hole(x, y, 4) for x, y in holes)]


def inside_left_triangle(p):
    x, y = p
    return y > x + 3 and x + y < 77 and x > 13


# ----------------------------------------------------------------------
# Series with a gap in the middle
# ----------------------------------------------------------------------
def strip_gap(cells, gap):
    out = []
    for i, c in enumerate(cells):
        inner = QMARK if i == gap else c
        out.append(f'<g transform="translate({i * 90 + 5},5)">{BOX}{inner}</g>')
    return svg("".join(out), len(cells) * 90, 90)


def row_of(figs):
    """Figures side by side with no question mark (examples)."""
    return svg("".join(f'<g transform="translate({5 + i * 90},5)">{BOX}{f}</g>' for i, f in enumerate(figs)), len(figs) * 90, 90)
