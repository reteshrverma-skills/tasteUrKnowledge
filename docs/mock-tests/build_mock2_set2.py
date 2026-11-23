"""Builds Mock Test 2, Set 2 (Challenger): original content only.

Set 1 used a story; Set 2 uses an original non-fiction article. Verbal and
Non-Verbal Reasoning are harder than Mock Test 1, and no question rule is
reused from Set 1. Maths and Verbal answers are recomputed and asserted;
Non-Verbal figures are drawn from their rules.

Usage:  python -I docs/mock-tests/build_mock2_set2.py docs/mock-tests
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fractions import Fraction
from itertools import permutations
from mock_lib import (MockSet, INK, GREY, WHITE, LET, BOX, SIDES, svg, opt, shape, dots, arrow, tf, HFLIP, VFLIP,
                      frame_strip, analogy, matrix, code_stem, poly_pts)
from mock2_lib import (wheel, poly_wheel, grid3, RING, small_arrow, hand_clock, unfolded, paper, dashed, hole,
                       fold_stem, curl, net, cube_opposites, reflect_antidiag, rot, LIGHT)

S = MockSet(seed=20261123)
add = S.add

# =========================================================================
# ENGLISH - original non-fiction article
# =========================================================================
TITLE = "A Thousand Lodgers"
STORY = """If you want to see a city, you do not need to travel to London or New York. You only need to find an old oak tree and sit underneath it for an hour.

At first, you will see very little: a trunk, some branches, a scatter of leaves. Oaks are not showy trees. They do not flower in clouds of pink like cherries, or blaze red in autumn like maples. An oak simply stands there, broad and grey and patient, as though it has been waiting for you to notice it, and is prepared to wait a good deal longer.

But look closer, and the city begins to appear.

Start at the bottom. Among the roots, hidden in the soil, runs a web of fungus threads so fine that a single one is almost invisible. Together they spread for metres, wrapping around the roots like a glove. The fungus helps the tree to drink in water and minerals; in return, the tree feeds the fungus with sugar made in its leaves. Neither could thrive so well alone. It is a partnership older than any human city, and far better run.

Now look at the bark. What you took for grey is really a patchwork of pale green, yellow and silver: lichens, each one a partnership of its own, clinging to the ridges. In the cracks between them live beetles, spiders and tiny insects that most of us would never see without a magnifying glass. A treecreeper, a small brown bird with a curved beak, spirals up the trunk, picking them out one by one like a shopper working along the shelves.

Higher still, the branches are busy. Caterpillars chew the young leaves in spring, and blue tits time the hatching of their chicks so that there are as many caterpillars as possible to feed them. Woodpeckers drill holes that, years later, become homes for owls or roosting places for bats. Squirrels build untidy nests called dreys where the branches fork. Scientists who studied Britain's native oaks found that more than two thousand different species make use of them in some way. Some could live almost nowhere else.

Even the oak's leaves, when they fall, are not wasted. They are tough and slow to rot, so they form a thick blanket on the ground, sheltering worms, woodlice and the creatures that feed on them. Slowly, they break down and return their goodness to the soil, which feeds the roots, which feed the tree. Nothing in this city is thrown away.

Then there are the acorns. In a good year, a single large oak may drop tens of thousands of them. Most are eaten by mice, deer, pigeons or wild boar. But the jay, a bird with a pinkish body and a flash of electric blue on its wings, does something cleverer. It carries acorns away and buries them, one at a time, to eat in winter. A jay can bury thousands in a single autumn, and it does not find them all. The ones it forgets may become new oaks, perhaps hundreds of metres from their parent. Without meaning to, the jay is a gardener.

All of this takes time. An oak may not produce acorns until it is forty years old, and it may live for many hundreds of years. Some of the oaks standing in Britain today were already old when the first steam trains ran. They have watched over fields and villages that have changed beyond recognition, while they themselves have changed only slowly.

This is perhaps the most important thing an oak can teach us. We live in a hurry. We expect answers in seconds and parcels by tomorrow. An oak works on a different clock. The person who plants an acorn will almost certainly never sit in the shade of the tree it becomes. They plant it anyway, for people they will never meet.

So the next time you pass an old oak, slow down. Sit for a while. Watch the treecreeper on its spiral and the jay on its errands. Listen to the leaves. You are not looking at one tree. You are looking at a city of a thousand lodgers, built without a single brick, that has been quietly working for longer than anyone can remember.

And if you happen to find an acorn, you might consider planting it."""

E = "ENGLISH"
def eng(qtype, quest, answer, distractors, explanation):
    add(E, "Comprehension", None, qtype, quest, answer, distractors, explanation)

eng("author's purpose", "Why does the writer begin by comparing an oak tree to a city?",
    "To suggest that an oak is home to a huge number of living things that depend on each other",
    ["To show that oak trees grow best in cities", "To compare the size of an oak with a skyscraper",
     "To persuade readers to visit London or New York", "To explain that cities are bad for trees"],
    "The whole article shows the oak as a busy, crowded home where many creatures live and work together.")
eng("retrieval", "According to the article, which of these is NOT true of oaks?",
    "They blaze red in autumn", ["They are not showy trees", "They have tough leaves that are slow to rot",
     "They can live for many hundreds of years", "They are used by more than two thousand species"],
    "The writer says oaks do NOT 'blaze red in autumn like maples'.")
eng("language effects", "The oak \"is prepared to wait a good deal longer\". What does this personification suggest?",
    "That the oak is calm and in no hurry", ["That the oak is angry at being ignored",
     "That the oak is about to fall down", "That the oak is waiting for rain", "That the oak is lonely"],
    "Giving the tree human patience prepares for the later idea that an oak 'works on a different clock'.")
eng("retrieval", "What does the tree give the fungus in return for help with water and minerals?",
    "Sugar made in its leaves", ["Acorns", "Shelter from the rain", "Fallen leaves", "Oxygen from its roots"],
    "'The tree feeds the fungus with sugar made in its leaves.'")
eng("language effects", "The fungus wraps around the roots \"like a glove\". What does this simile suggest?",
    "It fits closely all around the roots", ["It keeps the roots warm in winter",
     "It can easily be taken off", "It is made of wool", "It protects the roots from animals"],
    "A glove fits snugly around a hand, just as the fungus threads wrap tightly around the roots.")
eng("inference", "Why does the writer say the partnership is \"far better run\" than a human city?",
    "Because both partners benefit and nothing is wasted",
    ["Because it has a mayor and a council", "Because fungi are cleverer than people",
     "Because it is much smaller than a city", "Because it never changes"],
    "Each side gives the other what it needs, a fairness the writer suggests human cities do not always manage.")
eng("vocabulary", "In the article, what does \"thrive\" mean?",
    "Grow and do well", ["Survive with difficulty", "Move away", "Drink water", "Stay the same"],
    "'Neither could thrive so well alone' means neither would grow and do as well on its own.")
eng("language effects", "The treecreeper picks out insects \"like a shopper working along the shelves\". What does this suggest about how it feeds?",
    "It searches carefully and steadily, choosing food as it goes",
    ["It feeds only on food bought from shops", "It feeds very quickly and carelessly",
     "It feeds on the shelves of fungus", "It shares its food with other birds"],
    "A shopper moves along methodically, picking items one by one, as the bird does on the trunk.")
eng("inference", "Why do blue tits time the hatching of their chicks?",
    "So that there is as much food as possible when the chicks need feeding",
    ["So that the chicks hatch before the woodpeckers", "So that the caterpillars do not eat the eggs",
     "So that the chicks can leave before winter", "So that they can use the squirrels' dreys"],
    "They hatch when there are 'as many caterpillars as possible to feed them'.")
eng("retrieval", "What is a drey?", "A squirrel's nest", ["A hole made by a woodpecker", "A blanket of fallen leaves",
     "A type of lichen", "A bat's roosting place"], "'Squirrels build untidy nests called dreys.'")
eng("multi-step reasoning", "How do woodpeckers help other animals, according to the article?",
    "The holes they drill later become homes for owls and bats",
    ["They eat the caterpillars that damage leaves", "They bury acorns that grow into new trees",
     "They warn other birds of danger", "They keep the bark free of lichen"],
    "Holes drilled by woodpeckers 'years later, become homes for owls or roosting places for bats'.")
eng("structure", "\"Nothing in this city is thrown away.\" How does this sentence connect to the paragraph before it?",
    "It sums up how fallen leaves are recycled back into the soil to feed the tree",
    ["It introduces a new paragraph about acorns", "It contradicts what the writer said about leaves",
     "It explains why oaks lose their leaves", "It shows the writer is worried about litter"],
    "The paragraph traces leaves to soil to roots to tree; the closing sentence sums up the cycle.")
eng("language effects", "Why does the writer call the jay \"a gardener\"?",
    "Because by forgetting buried acorns it plants new oaks", ["Because it looks after flowers",
     "Because it eats insects that harm plants", "Because it lives in gardens", "Because it digs up worms"],
    "The jay buries acorns and does not find them all, so it plants trees 'without meaning to'.")
eng("retrieval", "According to the article, how old may an oak be before it produces acorns?",
    "Forty years old", ["Four years old", "Ten years old", "One hundred years old", "Several hundred years old"],
    "'An oak may not produce acorns until it is forty years old.'")
eng("viewpoint", "What does the writer suggest is \"the most important thing an oak can teach us\"?",
    "To be patient and to do things that will benefit others in the future",
    ["To plant as many trees as possible", "To protect the animals that live in oaks",
     "To travel less and stay at home", "To stop buying parcels online"],
    "We 'live in a hurry', but someone who plants an acorn does it 'for people they will never meet'.")
eng("structure", "Why do several paragraphs begin with phrases such as \"Start at the bottom\", \"Now look at the bark\" and \"Higher still\"?",
    "They guide the reader up the tree, as if on a tour", ["They show that the writer is lost",
     "They give instructions for climbing a tree", "They list the parts of a tree in alphabetical order",
     "They show the order in which the tree grows"],
    "The phrases move the reader from roots to bark to branches, like a guide leading a tour.")
eng("author's purpose", "What is the main purpose of the article?",
    "To help readers appreciate how much life an oak supports and why it is worth valuing",
    ["To explain how to grow an oak from an acorn", "To argue that oaks should be cut down",
     "To describe the life of a jay", "To compare oaks with every other kind of tree"],
    "The article reveals the oak's hidden 'city' and ends by encouraging readers to slow down and value it.")
eng("structure", "Why does the article end with the suggestion that you might plant an acorn?",
    "It invites the reader to act on the lesson about patience and the future",
    ["It shows that acorns are rare", "It reminds readers that jays bury acorns",
     "It suggests that the writer has run out of ideas", "It warns readers not to eat acorns"],
    "Planting an acorn is exactly the patient, unselfish act the writer has just praised.")

# =========================================================================
# MATHS
# =========================================================================
M = "MATHS"
assert 647 * 38 == 24586
add(M, "Number", "Long multiplication", "calculation", "What is 647 × 38?",
    "24,586", ["24,486", "25,586", "7,117", "24,596"], "647 × 30 = 19,410 and 647 × 8 = 5,176; 19,410 + 5,176 = 24,586.")
assert Fraction(4, 9) * Fraction(3, 8) == Fraction(1, 6)
add(M, "Fractions", "Multiplying fractions", "calculation", "What is 4/9 × 3/8?",
    "1/6", ["7/17", "12/17", "1/3", "32/27"], "4 × 3 = 12 and 9 × 8 = 72; 12/72 = 1/6.")
assert Fraction(36, 48) * 100 == 75
add(M, "Percentages", "Writing as a percentage", "calculation", "In a test, Maya scored 36 out of 48. What percentage is this?",
    "75%", ["36%", "70%", "80%", "12%"], "36/48 = 3/4 = 75%.")
add(M, "Ratio", "Map scales", "word problem", "A map has a scale of 1 : 25,000. Two villages are 6 cm apart on the map. How far apart are they in real life?",
    "1.5 km", ["150 m", "15 km", "25 km", "6 km"], "6 × 25,000 = 150,000 cm = 1,500 m = 1.5 km.")
assert 6 * 25000 == 150000
add(M, "Algebra", "Expressions", "reasoning", "Which expression means \"add 5 to n, then multiply by 3\"?",
    "3(n + 5)", ["3n + 5", "n + 15", "5(n + 3)", "3 + 5n"], "Adding first means the bracket comes first: (n + 5) × 3 = 3(n + 5).")
seq = [3, 7, 11, 15]; assert all(4 * k - 1 == seq[k - 1] for k in range(1, 5))
add(M, "Algebra", "nth term", "pattern", "Which rule gives the nth term of the sequence 3, 7, 11, 15, …?",
    "4n − 1", ["n + 4", "4n + 3", "3n + 4", "4n + 1"], "It goes up by 4, so it starts 4n; 4 × 1 = 4 and the first term is 3, so subtract 1.")
data = [4, 7, 7, 9, 12, 15]; assert max(data) - min(data) == 11
add(M, "Statistics", "Range and mode", "calculation", "What is the range of 9, 4, 15, 7, 12, 7?",
    "11", ["7", "15", "8", "9"], "Range = largest − smallest = 15 − 4 = 11. (7 is the mode.)")
assert 3 * 7 + 4 * 2 == 29
add(M, "Statistics", "Reading tables", "multi-step",
    "A café sells sandwiches at £3 and cakes at £2. On Monday it sold 7 sandwiches and 4 cakes. How much money did it take?",
    "£29", ["£26", "£22", "£33", "£35"], "7 × £3 = £21 and 4 × £2 = £8; £21 + £8 = £29.")
assert (6 - 2) * 180 == 720 and 720 // 6 == 120
add(M, "Shape", "Angles in polygons", "reasoning", "What is the size of each interior angle of a regular hexagon?",
    "120°", ["60°", "108°", "135°", "720°"], "The angles of a hexagon add to (6 − 2) × 180° = 720°; 720 ÷ 6 = 120°.")
assert 180 - 47 == 133
ANG = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120" width="300" height="164">'
       '<line x1="10" y1="90" x2="210" y2="90" stroke="#1f2937" stroke-width="2"/>'
       '<line x1="110" y1="90" x2="170" y2="20" stroke="#1f2937" stroke-width="2"/>'
       '<text x="140" y="84" font-size="12" fill="#1f2937">47°</text>'
       '<text x="86" y="78" font-size="13" font-weight="bold" fill="#1f2937">x</text>'
       '<text x="110" y="112" font-size="9" text-anchor="middle" fill="#6b7280">Not drawn to scale</text></svg>')
add(M, "Shape", "Angles on a straight line", "diagram", "Find the angle marked x.",
    "133°", ["47°", "143°", "43°", "313°"], "Angles on a straight line add up to 180°: 180 − 47 = 133°.", stem=ANG)
add(M, "Shape", "Area of a rectangle", "word problem",
    "A rectangular garden is 12 m long and has an area of 78 m². How wide is it?",
    "6.5 m", ["6 m", "7 m", "66 m", "13 m"], "Width = area ÷ length = 78 ÷ 12 = 6.5 m.")
assert Fraction(78, 12) == Fraction(13, 2)
assert 3 * 1000 + 450 - 1750 == 1700
add(M, "Measures", "Mass", "word problem",
    "A bag of flour weighs 3.45 kg. Tom uses 1,750 g. How much is left?",
    "1.7 kg", ["1.75 kg", "2.7 kg", "1.6 kg", "5.2 kg"], "3.45 kg = 3,450 g; 3,450 − 1,750 = 1,700 g = 1.7 kg.")
assert (23 * 60 + 40) + 95 - 24 * 60 == 1 * 60 + 15
add(M, "Measures", "Time", "word problem", "A flight leaves at 23:40 and lasts 1 hour 35 minutes. At what time does it land?",
    "01:15", ["00:15", "01:05", "25:15", "00:75"], "23:40 + 20 min = 00:00; another 1 h 15 min gives 01:15.")
sq = [n * n for n in range(1, 20) if 50 < n * n < 150]; assert sq == [64, 81, 100, 121, 144]
add(M, "Number", "Square numbers", "reasoning", "How many square numbers are between 50 and 150?",
    "5", ["4", "6", "7", "3"], "64, 81, 100, 121 and 144.")
assert 2 ** 3 * 3 ** 2 == 72
add(M, "Number", "Prime factors", "reasoning", "Which of these is 72 written as a product of prime factors?",
    "2³ × 3²", ["2² × 3³", "8 × 9", "2 × 36", "2⁴ × 3"], "72 = 8 × 9 = 2 × 2 × 2 × 3 × 3 = 2³ × 3².")
nums = ["0.405", "0.45", "0.4", "0.425", "0.44"]
assert sorted(nums, key=float) == ["0.4", "0.405", "0.425", "0.44", "0.45"]
add(M, "Number", "Ordering decimals", "reasoning", "Which number is the third smallest?\n0.405   0.45   0.4   0.425   0.44",
    "0.425", ["0.405", "0.45", "0.4", "0.44"], "In order: 0.4, 0.405, 0.425, 0.44, 0.45. The third is 0.425.")
add(M, "Shape", "Translation", "reasoning",
    "The point (−2, 5) is moved 4 units right and 3 units down. Where does it end up?",
    "(2, 2)", ["(−6, 8)", "(2, 8)", "(−6, 2)", "(1, 1)"], "x: −2 + 4 = 2. y: 5 − 3 = 2.")
assert Fraction(1, 6) * 120 == 20
add(M, "Statistics", "Expected outcomes", "reasoning", "A fair dice is rolled 120 times. About how many times would you expect it to land on 6?",
    "20", ["6", "12", "60", "24"], "The chance of a 6 is 1/6; 1/6 of 120 is 20.")
assert (85 - 13) // 4 == 18 and 18 + 13 + 18 * 3 == 85
add(M, "Algebra", "Forming equations", "multi-step",
    "A pencil costs p pence and a ruler costs 13p more. Three pencils and a ruler cost 85p. How much is one pencil?",
    "18p", ["13p", "24p", "31p", "21p"], "3p + (p + 13) = 85, so 4p = 72 and p = 18.")
assert 4 * 18 + 13 == 85
assert 3 * 18 + (18 + 13) == 85
add(M, "Measures", "Speed, distance, time", "word problem", "A cyclist rides at 18 km/h. How far does she ride in 40 minutes?",
    "12 km", ["7.2 km", "720 km", "10 km", "14 km"], "40 minutes is 2/3 of an hour; 2/3 × 18 = 12 km.")
assert Fraction(2, 3) * 18 == 12

# =========================================================================
# VERBAL REASONING - harder than Mock Test 1
# =========================================================================
V = "VERBAL"
A = ord("A")
def shift_each(word, steps):
    return "".join(chr((ord(c) - A + k) % 26 + A) for c, k in zip(word, steps))
def atbash(word):
    return "".join(chr(155 - ord(c)) for c in word)

# 1 Alternating shift +1, -1
alt = lambda w: shift_each(w, [1 if i % 2 == 0 else -1 for i in range(len(w))])
assert alt("MINT") == "NHOS"
ans = alt("CLOUD"); assert ans == "DKPTE"
add(V, "Codes", "Alternating shift", "letter code",
    "In a code, MINT is written as NHOS. How would CLOUD be written in the same code?",
    ans, [shift_each("CLOUD", [1] * 5), shift_each("CLOUD", [-1] * 5), "DKPTF", shift_each("CLOUD", [-1, 1, -1, 1, -1])],
    "The letters move forward 1, back 1, forward 1, back 1, and so on: C→D, L→K, O→P, U→T, D→E.")
# 2 Mirror alphabet, then written backwards
code = lambda w: atbash(w)[::-1]
assert code("SHIP") == "KRSH"
ans = code("BOAT"); assert ans == "GZLY"
add(V, "Codes", "Two-step code", "letter code",
    "In a code, SHIP is written as KRSH. How would BOAT be written in the same code?",
    ans, [atbash("BOAT"), "TAOB", "GZLX", "HZLY"],
    "Each letter is swapped with its partner from the other end of the alphabet (A↔Z, B↔Y, …) and then the word is written backwards. BOAT → YLZG → GZLY.")
# 3 Two letter series, alternate
s = ["Z", "B", "X", "D", "V", "F"]; assert [ord(c) for c in s[0::2]] == [90, 88, 86] and [ord(c) for c in s[1::2]] == [66, 68, 70]
add(V, "Series", "Two series", "letter series", "Find the next letter: Z, B, X, D, V, F, ?",
    "T", ["H", "U", "S", "G"], "Two series take turns: Z, X, V, T go back 2 each time; B, D, F go forward 2.")
# 4 Differences double
s = [5]; d = 2
for _ in range(5):
    s.append(s[-1] + d); d *= 2
assert s == [5, 7, 11, 19, 35, 67]
add(V, "Series", "Number series", "number series", "Find the next number: 5, 7, 11, 19, 35, ?",
    "67", ["51", "66", "69", "70"], "The differences double each time: 2, 4, 8, 16, so the next difference is 32: 35 + 32 = 67.")
# 5 Odd-number differences going down
s = [100]; [s.append(s[-1] - (2 * k + 1)) for k in range(5)]; assert s == [100, 99, 96, 91, 84, 75]
add(V, "Series", "Number series", "number series", "Find the next number: 100, 99, 96, 91, 84, ?",
    "75", ["77", "74", "73", "76"], "The amounts taken away are 1, 3, 5, 7, so next is 9: 84 − 9 = 75.")
# 6 Brackets: a x b - a
assert 6 * 5 - 6 == 24 and 4 * 8 - 4 == 28 and 7 * 6 - 7 == 35
add(V, "Number", "Related numbers", "missing number",
    "The numbers in each group are related in the same way. Find the missing number.\n6 (24) 5     4 (28) 8     7 ( ? ) 6",
    "35", ["42", "36", "13", "49"], "Multiply the outside numbers, then take away the first: 6 × 5 − 6 = 24, 4 × 8 − 4 = 28, 7 × 6 − 7 = 35.")
# 7 Missing three-letter word
assert "B" + "RAN" + "CH" == "BRANCH"
add(V, "Word building", "Missing three letters", "missing word",
    "Three letters that make a word have been taken out of the word in capitals. Which three letters complete it?\nA robin sat on the highest BCH of the tree.",
    "RAN", ["EAR", "OAT", "ATE", "END"], "B + RAN + CH = BRANCH.")
# 8 Word pairs: reversed
assert "stop"[::-1] == "pots" and "reed"[::-1] == "deer" and "lever"[::-1] == "revel"
add(V, "Word building", "Word pairs", "word pattern",
    "Find the word that completes the third pair in the same way as the first two.\n(stop, pots)   (reed, deer)   (lever, ?)",
    "revel", ["level", "ever", "lover", "never"], "Each word is written backwards: stop → pots, reed → deer, lever → revel.")
# 9 Synonyms across groups with antonym traps
add(V, "Vocabulary", "Synonyms", "synonym",
    "Choose one word from each group that are closest in meaning.\n(ancient, polite, sudden)   (courteous, rude, gradual)",
    "polite, courteous", ["polite, rude", "sudden, gradual", "ancient, gradual", "sudden, courteous"],
    "Polite and courteous both mean having good manners. Polite/rude and sudden/gradual are opposites.")
# 10 Antonyms across groups with synonym traps
add(V, "Vocabulary", "Antonyms", "antonym",
    "Choose one word from each group that are most nearly OPPOSITE in meaning.\n(generous, hidden, swift)   (concealed, rapid, selfish)",
    "generous, selfish", ["hidden, concealed", "swift, rapid", "swift, selfish", "hidden, rapid"],
    "Generous means happy to give; selfish means thinking only of yourself. Hidden/concealed and swift/rapid mean the same.")
# 11 Odd two out
add(V, "Vocabulary", "Odd two out", "classification",
    "Three of these words go together. Which TWO do not belong?\nsquare   circle   cube   triangle   sphere",
    "cube, sphere", ["square, circle", "circle, triangle", "square, cube", "triangle, sphere"],
    "Square, circle and triangle are flat (2-D) shapes. Cubes and spheres are solid (3-D).")
# 12 Hidden five-letter word
def hides(pair, word):
    a, b = pair.lower().split()
    j = a + b
    return any(j[i:i + len(word)] == word and i < len(a) < i + len(word) for i in range(len(j)))
assert hides("bear thought", "earth")
add(V, "Hidden words", "Across two words", "hidden word",
    "A five-letter word is hidden across the end of one word and the start of the next. Which pair hides it?\n\"The bear thought hard about the honey.\"",
    "bear thought", ["The bear", "thought hard", "hard about", "the honey"], "b(EAR TH)ought hides EARTH.")
# 13 Letter analogy going backwards
back = lambda p, k: "".join(chr(ord(c) - k) for c in p)
assert back("PM", 5) == "KH" and back("WT", 5) == "RO"
add(V, "Alphabet", "Letter analogies", "letter analogy", "PM is to KH as WT is to ?",
    "RO", ["SP", "QN", "RP", "SO"], "Each letter moves back 5 places: P→K, M→H, so W→R and T→O.")
# 14 A slow clock
mins = 6 * 4; assert (15 * 60 - mins) == 14 * 60 + 36
add(V, "Logic", "Time", "logic",
    "A clock loses 4 minutes every hour. It is set to the right time at 9:00 am. What time will it show when the real time is 3:00 pm the same day?",
    "2:36 pm", ["2:24 pm", "3:24 pm", "2:56 pm", "2:46 pm"], "From 9 am to 3 pm is 6 hours, so the clock loses 6 × 4 = 24 minutes and shows 2:36 pm.")
# 15 Heights: brute force
people = ["Ava", "Ben", "Cal", "Dee", "Eve"]
orders = [o for o in permutations(people)  # tallest first
          if o.index("Ava") < o.index("Ben") and o.index("Ben") < o.index("Cal") < o.index("Dee") and o.index("Eve") < o.index("Ava")]
assert len(orders) == 1 and orders[0][2] == "Ben"
add(V, "Logic", "Ordering", "logic",
    "Ava is taller than Ben. Cal is shorter than Ben but taller than Dee. Eve is taller than Ava. Who is the third tallest?",
    "Ben", ["Ava", "Cal", "Dee", "Eve"], "From tallest: Eve, Ava, Ben, Cal, Dee. Ben is third.")
# 16 Letters for numbers
val = {"A": 4, "B": 6, "C": 8, "D": 12, "E": 24}
r = Fraction(val["A"] * val["B"], val["C"] - val["A"]); assert [k for k, v in val.items() if v == r] == ["B"]
S.letters_question("Number", "Letters for numbers", "letter sum",
    "If A = 4, B = 6, C = 8, D = 12 and E = 24, what is (A × B) ÷ (C − A)? Give your answer as a letter.",
    "B", "A × B = 24 and C − A = 4; 24 ÷ 4 = 6, which is B.")
# 17 Which statement must be true
add(V, "Logic", "Must be true", "logic",
    "Everyone in the chess club also plays football. Some footballers wear glasses. Sam is in the chess club.\nWhich statement MUST be true?",
    "Sam plays football", ["Sam wears glasses", "All footballers play chess", "Sam does not wear glasses",
                           "Some chess players wear glasses"],
    "Everyone in the chess club plays football, so Sam must. Nothing tells us whether Sam, or any chess player, wears glasses.")
# 18 Middle word from two outer words
mid = lambda a, b: a[-2:] + b[-2:]
assert mid("fish", "stop") == "shop" and mid("rose", "boat") == "seat"
add(V, "Word building", "Middle word", "word pattern",
    "The word in brackets is made from the two outside words. Make the missing word in the same way.\nfish [shop] stop        rose [ ? ] boat",
    "seat", ["rest", "boss", "sent", "oats"], "The last two letters of the first word and the last two of the second: fi(SH) + st(OP) = SHOP, ro(SE) + bo(AT) = SEAT.")
# 19 Analogy across two groups
add(V, "Vocabulary", "Analogies", "analogy",
    "Choose one word from each group to complete the sentence.\nPen is to (paper, write, ink) as knife is to (blade, cut, fork).",
    "write, cut", ["ink, blade", "paper, fork", "write, blade", "ink, cut"], "A pen is used to write; a knife is used to cut.")
# 20 Word values: A = 1, B = 2, ...
wv = lambda w: sum(ord(c) - 64 for c in w)
options = ["JADE", "BEAD", "FACE", "HIDE", "CAGE"]
assert [w for w in options if wv(w) == 20] == ["JADE"]
add(V, "Codes", "Word values", "letter sum",
    "If A = 1, B = 2, C = 3 and so on up to Z = 26, which word has letters that add up to 20?",
    "JADE", ["BEAD", "FACE", "HIDE", "CAGE"], "J + A + D + E = 10 + 1 + 4 + 5 = 20. (BEAD 12, FACE 15, HIDE 26, CAGE 16.)")

# =========================================================================
# NON-VERBAL REASONING - harder than Mock Test 1
# =========================================================================
N = "NON_VERBAL"
def nvr(topic, sub, qtype, quest, stem, answer, distractors, explanation, option_format="svg"):
    add(N, topic, sub, qtype, quest, answer, distractors, explanation, stem=stem, option_format=option_format)

SEQ_Q = "Which figure comes next in the sequence?"
ODD_Q = "Which figure is the odd one out?"
AN_Q = "The first figure changes into the second. Which option changes in the same way from the third figure?"

# 1 Hexagon drawn side by side; the dot jumps two corners each time
def hexv(i, r=28):
    a = math.radians(-90 + 60 * i)
    return 40 + r * math.cos(a), 40 + r * math.sin(a)
def hexdraw(sides, dot):
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in (hexv(i) for i in range(sides + 1)))
    dx, dy = hexv(dot)
    return (f'<polyline points="{pts}" fill="none" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>'
            f'<circle cx="{dx:.1f}" cy="{dy:.1f}" r="5" fill="{INK}"/>')
fr = [(k + 2, (2 * k) % 6) for k in range(5)]; assert fr[4] == (6, 2)
nvr("Sequences", "Two rules", "sequence", SEQ_Q, frame_strip([hexdraw(*f) for f in fr[:4]]),
    opt(hexdraw(6, 2)), [opt(hexdraw(6, 4)), opt(hexdraw(5, 2)), opt(hexdraw(6, 0)), opt(hexdraw(6, 3))],
    "One more side of the hexagon is drawn each time, and the dot jumps two corners clockwise. Next the hexagon is complete and the dot is on the third corner from the top, clockwise.")
# 2 Growing run of black squares that jumps round the ring
def run(start, n):
    return grid3(black=tuple(RING[(start + i) % 8] for i in range(n)))
fr = [(2 * k, k + 1) for k in range(5)]
nvr("Sequences", "Growing and moving", "sequence", SEQ_Q, frame_strip([run(s, n) for s, n in fr[:4]]),
    opt(run(0, 5)), [opt(run(7, 5)), opt(run(0, 4)), opt(run(1, 5)), opt(grid3(black=tuple(RING[i] for i in range(4)) + (4,)))],
    "Each time the run of black squares gets one longer and its first square jumps two places clockwise round the edge. The 5th run starts back at the top-left and has 5 squares.")
# 3 Clock: long hand +90°, short hand +30°
fr = [(90 * k % 360, 30 * k) for k in range(5)]
nvr("Sequences", "Two speeds", "sequence", SEQ_Q, frame_strip([hand_clock(*f) for f in fr[:4]]),
    opt(hand_clock(0, 120)), [opt(hand_clock(120, 0)), opt(hand_clock(90, 120)), opt(hand_clock(0, 150)), opt(hand_clock(0, 90))],
    "The long hand turns 90° clockwise each time and the short hand turns 30°. Next the long hand points straight up and the short hand points to 4 o'clock.")
# 4 Alternating sequence
def tri_d(a, n):
    return rot(f'<polygon points="40,12 66,62 14,62" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>', a) + dots(n, r=3, gap=9)
GREYC = shape("circle", fill=GREY, r=22)
seq = [tri_d(0, 1), shape("circle", fill=GREY, r=14), tri_d(90, 2), shape("circle", fill=GREY, r=22)]
nvr("Sequences", "Alternating", "sequence", SEQ_Q, frame_strip(seq),
    opt(tri_d(180, 3)), [opt(shape("circle", fill=GREY, r=30)), opt(tri_d(180, 2)), opt(tri_d(270, 3)), opt(tri_d(90, 3))],
    "Two sequences take turns. The 1st, 3rd and 5th figures are triangles that turn 90° clockwise and gain a dot each time. The 2nd and 4th are grey circles that grow. The 5th figure is the next triangle: turned 180° with 3 dots.")
# 5 Odd one out: exactly half shaded
assert Fraction(2, 6) != Fraction(1, 2)
half = [wheel([INK, WHITE] * 4), poly_wheel([INK, INK, WHITE, WHITE]), poly_wheel([INK, WHITE, INK, INK, WHITE, WHITE]),
        poly_wheel([WHITE, INK, INK, WHITE, INK, WHITE, WHITE, INK])]
nvr("Odd one out", "Fractions of a shape", "odd one out", ODD_Q, None,
    opt(poly_wheel([INK, WHITE, WHITE, INK, WHITE, WHITE])), [opt(h) for h in half],
    "In four figures exactly half of the shape is shaded (4 of 8, 2 of 4, 3 of 6, 4 of 8). The odd one out has 2 of 6 shaded, which is only a third.")
# 6 Odd one out: as many black shapes as white
SPOTS = [(22, 22), (40, 22), (58, 22), (22, 40), (40, 40), (58, 40), (22, 58), (40, 58), (58, 58)]
def mix(items):
    out = []
    for (kind, fill), (x, y) in zip(items, [SPOTS[i] for i in (0, 2, 4, 6, 8, 1, 7)]):
        out.append(shape(kind, fill=fill, cx=x, cy=y, r=7))
    return "".join(out)
good = [[("circle", INK), ("square", WHITE), ("triangle", INK), ("circle", WHITE)],
        [("square", INK), ("square", WHITE), ("circle", INK), ("triangle", WHITE), ("triangle", INK), ("circle", WHITE)],
        [("triangle", WHITE), ("triangle", INK)],
        [("circle", WHITE), ("circle", WHITE), ("square", INK), ("square", INK)]]
bad = [("circle", INK), ("triangle", WHITE), ("square", INK), ("circle", WHITE), ("triangle", INK)]
count = lambda items, f: sum(1 for _, x in items if x == f)
assert all(count(g, INK) == count(g, WHITE) for g in good) and count(bad, INK) != count(bad, WHITE)
nvr("Odd one out", "Counting", "odd one out", ODD_Q, None,
    opt(mix(bad)), [opt(mix(g)) for g in good],
    "In four figures there are as many black shapes as white ones. The odd one out has 3 black and 2 white.")
# 7 Odd one out: the dot is inside the triangle but outside the circle
TRI = [(14, 66), (66, 66), (40, 14)]
CIR = (40, 52, 12)
def in_tri(p):
    (x1, y1), (x2, y2), (x3, y3) = TRI
    def s(a, b, c):
        return (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1])
    d1, d2, d3 = s(p, TRI[0], TRI[1]), s(p, TRI[1], TRI[2]), s(p, TRI[2], TRI[0])
    return not ((d1 < 0 or d2 < 0 or d3 < 0) and (d1 > 0 or d2 > 0 or d3 > 0))
def in_cir(p):
    return math.dist(p, CIR[:2]) < CIR[2]
def venn(dot, a):
    return rot(f'<polygon points="{" ".join(f"{x},{y}" for x, y in TRI)}" fill="none" stroke="{INK}" stroke-width="2"/>'
               f'<circle cx="{CIR[0]}" cy="{CIR[1]}" r="{CIR[2]}" fill="none" stroke="{INK}" stroke-width="2"/>'
               f'<circle cx="{dot[0]}" cy="{dot[1]}" r="3.5" fill="{INK}"/>', a)
goods = [((40, 30), 0), ((22, 60), 90), ((58, 61), 180), ((40, 32), 270)]
assert all(in_tri(p) and not in_cir(p) for p, _ in goods)
odd = ((44, 52), 0); assert in_tri(odd[0]) and in_cir(odd[0])
nvr("Odd one out", "Overlapping shapes", "odd one out", ODD_Q, None,
    opt(venn(*odd)), [opt(venn(p, a)) for p, a in goods],
    "In four figures the dot is inside the triangle but outside the circle. In the odd one out it is inside both. Turning the figure does not matter.")
# 8 Analogy: half turn and one more circle
def with_circles(body, n):
    xs = {1: [40], 2: [33, 47], 3: [26, 40, 54]}[n]
    return body + "".join(f'<circle cx="{x}" cy="40" r="4.5" fill="{WHITE}" stroke="{INK}" stroke-width="1.8"/>' for x in xs)
ARROWB = f'<polygon points="40,10 64,34 50,34 50,70 30,70 30,34 16,34" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
HOUSE = f'<polygon points="12,34 40,12 68,34 68,58 52,58 52,70 12,70" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
nvr("Analogies", "Two changes", "analogy", AN_Q,
    analogy(with_circles(ARROWB, 1), with_circles(rot(ARROWB, 180), 2), with_circles(HOUSE, 2)),
    opt(with_circles(rot(HOUSE, 180), 3)),
    [opt(with_circles(rot(HOUSE, 180), 2)), opt(with_circles(HOUSE, 3)), opt(with_circles(tf(HOUSE, VFLIP), 3)), opt(with_circles(rot(HOUSE, 90), 3))],
    "The shape makes a half turn and gains one circle. The house turns 180° (its notch moves to the top left) and has 3 circles. A top-to-bottom reflection would put the notch at the top right.")
# 9 Analogy: order reversed and black/white swapped (grey stays)
def row3(items):
    return "".join(shape(k, fill=f, cx=x, cy=40, r=10) for (k, f), x in zip(items, (17, 40, 63)))
inv = {INK: WHITE, WHITE: INK, GREY: GREY}
a = [("circle", INK), ("square", WHITE), ("triangle", GREY)]
c = [("pentagon", WHITE), ("circle", GREY), ("square", INK)]
f = lambda items: [(k, inv[x]) for k, x in reversed(items)]
nvr("Analogies", "Two changes", "analogy", AN_Q,
    analogy(row3(a), row3(f(a)), row3(c)),
    opt(row3(f(c))), [opt(row3(list(reversed(c)))), opt(row3([(k, inv[x]) for k, x in c])), opt(row3(c)),
                      opt(row3([("square", WHITE), ("circle", INK), ("pentagon", INK)]))],
    "The shapes are put in reverse order, and black and white swap; grey stays grey.")
# 10 Analogy: outer loses a side, inner gains one
def oi(outer, inner):
    return shape(outer, fill=WHITE, r=32) + shape(inner, fill=GREY, r=12)
assert SIDES["hexagon"] - 1 == SIDES["pentagon"] and SIDES["triangle"] + 1 == SIDES["square"]
nvr("Analogies", "Counting sides", "analogy", AN_Q,
    analogy(oi("hexagon", "triangle"), oi("pentagon", "square"), oi("square", "pentagon")),
    opt(oi("triangle", "hexagon")), [opt(oi("pentagon", "square")), opt(oi("triangle", "square")), opt(oi("pentagon", "hexagon")), opt(oi("hexagon", "triangle"))],
    "The outer shape loses one side and the inner shape gains one: 6 and 3 become 5 and 4. So 4 and 5 become 3 and 6.")
# 11 Matrix 3 x 3: third = first and second combined
PARTS = {
    "c": f'<circle cx="22" cy="22" r="8" fill="{INK}"/>',
    "s": f'<rect x="50" y="14" width="16" height="16" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>',
    "t": f'<polygon points="22,50 32,66 12,66" fill="{GREY}" stroke="{INK}" stroke-width="2"/>',
    "x": f'<line x1="50" y1="50" x2="66" y2="66" stroke="{INK}" stroke-width="3"/><line x1="66" y1="50" x2="50" y2="66" stroke="{INK}" stroke-width="3"/>',
    "o": f'<circle cx="40" cy="40" r="6" fill="none" stroke="{INK}" stroke-width="2"/>',
}
def parts(p):
    return "".join(PARTS[k] for k in "cstxo" if k in p)
rows = [({"c"}, {"x", "o"}), ({"s", "t"}, {"c"}), ({"t", "o"}, {"s", "x"})]
cells = []
for a1, b1 in rows:
    cells += [parts(a1), parts(b1), parts(a1 | b1)]
nvr("Matrices", "Combining", "matrix", "Which option completes the grid?", matrix(cells[:-1], 3),
    opt(parts({"t", "o", "s", "x"})), [opt(parts({"t", "o", "s"})), opt(parts({"s", "x"})), opt(parts({"c", "t", "o", "s", "x"})), opt(parts({"t", "s", "x"}))],
    "In each row the third figure contains everything from the first two figures put together.")
# 12 Matrix 3 x 3: turns 45° across, shading cycles
FILLS = [INK, GREY, WHITE]
cells = [arrow(45 * cc + 90 * r, FILLS[(r + cc) % 3]) for r in range(3) for cc in range(3)]
assert (45 * 2 + 90 * 2) == 270 and FILLS[(2 + 2) % 3] == GREY
nvr("Matrices", "Rows and columns", "matrix", "Which option completes the grid?", matrix(cells[:-1], 3),
    opt(arrow(270, GREY)), [opt(arrow(270, INK)), opt(arrow(225, GREY)), opt(arrow(90, GREY)), opt(arrow(270, WHITE))],
    "Across a row the arrow turns 45° clockwise; each row starts 90° further round than the one above. The shading runs black, grey, white along each diagonal. The missing arrow points left and is grey.")
# 13 Reflection in the other diagonal
Q = (f'<polygon points="14,14 40,14 40,24 24,24 24,40 14,40" fill="{INK}"/>'
     f'<polygon points="46,40 66,40 66,66 56,66 56,50 46,50" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
     f'<circle cx="54" cy="22" r="6" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>')
stem = svg(f'<g transform="translate(5,5)">{Q}<line x1="80" y1="0" x2="0" y2="80" stroke="{INK}" stroke-width="2" stroke-dasharray="5,4"/></g>', 90, 90)
nvr("Reflection", "Diagonal mirror", "reflection", "Which option shows the figure reflected in the dashed diagonal mirror line?",
    stem, opt(reflect_antidiag(Q)), [opt(rot(Q, 90)), opt(rot(Q, 180)), opt(tf(Q, HFLIP)), opt(tf(Q, "matrix(0,1,1,0,0,0)"))],
    "The mirror runs from top right to bottom left. The black corner piece at the top left moves to the bottom right, the grey piece moves to the top left, and the circle stays on the mirror side at the top right.")
# 14 Quarter turn anticlockwise, mirror-image traps
R = (f'<polygon points="16,64 16,16 46,16 60,30 46,44 30,44 30,64" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
     f'<circle cx="38" cy="30" r="5" fill="{INK}"/><rect x="50" y="54" width="12" height="12" fill="{GREY}" stroke="{INK}" stroke-width="2"/>')
nvr("Rotation", "Quarter turn", "rotation", "Which option shows the figure turned 90° anticlockwise?",
    frame_strip([R], question=False),
    opt(rot(R, -90)), [opt(rot(R, 90)), opt(tf(rot(R, -90), HFLIP)), opt(tf(rot(R, -90), VFLIP)), opt(rot(R, 180))],
    "A quarter turn anticlockwise sends the right side of the figure to the top: the pointed end now points up and the grey square moves from the bottom right to the top right. Two options are mirror images.")
# 15 Fold top to bottom, then left to right; punch
hq = [(50, 62), (62, 48)]
def unf(hs):
    return sorted({(X, Y) for x, y in hs for X in (x, 80 - x) for Y in (y, 80 - y)})
ans = unf(hq); assert len(ans) == 8
steps = [paper(10, 10, 60, 60) + dashed(6, 40, 74, 40) + curl(30, 18, 30, 60),
         paper(10, 40, 60, 30) + dashed(40, 36, 40, 74) + curl(18, 50, 62, 50),
         paper(40, 40, 30, 30) + "".join(hole(x, y) for x, y in hq)]
w1 = sorted(set(hq) | {(x, 80 - y) for x, y in hq})
w2 = sorted(set(hq) | {(80 - x, y) for x, y in hq})
w3 = unf([(50, 62), (62, 56)])
w4 = sorted(set(ans) - {(18, 32)})
assert (18, 32) in ans and len({tuple(ans), tuple(w1), tuple(w2), tuple(w3), tuple(w4)}) == 5
nvr("Folding", "Fold and punch", "paper folding",
    "A square of paper is folded in half from top to bottom, then from left to right. Two holes are punched through it. What does the paper look like when it is unfolded?",
    fold_stem(steps), opt(unfolded(ans)), [opt(unfolded(w)) for w in (w1, w2, w3, w4)],
    "The holes go through four layers, making 8 holes. Unfolding reflects them in each fold line: left to right, then top to bottom.")
# 16 Cube net (T shape): which face is opposite?
cells = {(0, 0): "diamond", (0, 1): "dot", (0, 2): "cross", (1, 1): "circle", (2, 1): "black", (3, 1): "triangle"}
opp = cube_opposites(cells)
assert opp["diamond"] == "cross" and opp["dot"] == "black" and opp["circle"] == "triangle"
NAMES = {"dot": "The dot", "cross": "The cross", "circle": "The circle", "black": "The black square", "triangle": "The triangle"}
nvr("Cubes", "Nets", "cube net", "This net is folded to make a cube. Which face is opposite the diamond?",
    net(cells), NAMES["cross"], [NAMES[k] for k in ("dot", "circle", "black", "triangle")],
    "The diamond and the cross fold down on either side of the dot, so they end up facing each other on opposite sides of the cube.",
    option_format="text")
# 17 Codes: three letters, turning is a distraction
SH = {"square": "D", "triangle": "E", "pentagon": "F"}
FL = {INK: "M", WHITE: "N"}
DT = {1: "S", 2: "T"}
def c3(kind, fill, n, a):
    return rot(shape(kind, fill=fill, r=26), a) + dots(n, r=3.5, gap=11, fill=WHITE if fill == INK else INK)
ex = [("square", INK, 1, 0), ("triangle", WHITE, 2, 30), ("pentagon", INK, 2, 180), ("triangle", INK, 1, 90)]
nvr("Codes", "Spot what matters", "code",
    "Each figure has a three-letter code. Not every feature is part of the code. What is the code for the last figure?",
    code_stem([(c3(k, f, n, a), SH[k] + FL[f] + DT[n]) for k, f, n, a in ex], c3("pentagon", WHITE, 1, 45)),
    SH["pentagon"] + FL[WHITE] + DT[1], ["FMS", "FNT", "ENS", "DNS"],
    "The first letter is the shape (D square, E triangle, F pentagon), the second the shading (M black, N white) and the third the number of dots (S one, T two). Turning the shape is not part of the code. So FNS.",
    option_format="text")
# 18 Similarity: two shapes, and the black one has more sides
def pairfig(black, white, swap=False):
    b = shape(black, fill=INK, cx=26 if not swap else 54, cy=40, r=14)
    w = shape(white, fill=WHITE, cx=54 if not swap else 26, cy=40, r=14)
    return b + w
ex_stem = svg("".join(f'<g transform="translate({5 + i * 90},5)">{BOX}{fg}</g>'
                      for i, fg in enumerate([pairfig("hexagon", "square"), pairfig("pentagon", "triangle", swap=True)])), 180, 90)
assert SIDES["heptagon"] > SIDES["pentagon"]
nvr("Similarities", "Find the rule", "similarity", "Which option is most like the two figures on the left?",
    ex_stem, opt(pairfig("heptagon", "pentagon")),
    [opt(pairfig("square", "hexagon")), opt(pairfig("triangle", "triangle")), opt(pairfig("hexagon", "square") + shape("circle", fill=INK, cx=40, cy=66, r=6)),
     opt(shape("hexagon", fill=WHITE, cx=26, cy=40, r=14) + shape("square", fill=WHITE, cx=54, cy=40, r=14))],
    "Each figure has exactly two shapes, one black and one white, and the black shape has more sides. Only the black 7-sided shape with the white pentagon fits.")
# 19 Complete the symmetrical pattern
LEFT = [(0, 0), (1, 1), (0, 2), (1, 3), (0, 3)]      # (col, row) black cells in the left half
def half(cells, side):
    out = []
    for c in range(2):
        for r in range(4):
            x = 8 + c * 16 if side == "L" else 8 + c * 16
            out.append(f'<rect x="{x + 16}" y="{8 + r * 16}" width="16" height="16" fill="{INK if (c, r) in cells else WHITE}" stroke="{GREY}" stroke-width="1.5"/>')
    return "".join(out)
mirror_cells = {(1 - c, r) for c, r in LEFT}
def sym_stem():
    out = []
    for c in range(4):
        for r in range(4):
            black = c < 2 and (c, r) in LEFT
            fill = INK if black else (WHITE if c < 2 else "#f3f4f6")
            out.append(f'<rect x="{10 + c * 18}" y="{8 + r * 18}" width="18" height="18" fill="{fill}" stroke="{GREY}" stroke-width="1.5"/>')
    out.append(f'<line x1="46" y1="2" x2="46" y2="86" stroke="{INK}" stroke-width="2" stroke-dasharray="5,4"/>')
    out.append(f'<text x="73" y="50" font-size="22" text-anchor="middle" fill="#6b7280">?</text>')
    return svg("".join(out), 92, 90)
w_copy = set(LEFT)
w_flip = {(1 - c, 3 - r) for c, r in LEFT}
w_one = set(mirror_cells) - {(1, 2)}
w_extra = set(mirror_cells) | {(0, 2)}
assert len({frozenset(s) for s in (mirror_cells, w_copy, w_flip, w_one, w_extra)}) == 5
nvr("Symmetry", "Complete the pattern", "symmetry",
    "Which option completes the pattern so that it is symmetrical about the dashed line?",
    sym_stem(), opt(half(mirror_cells, "R")), [opt(half(s, "R")) for s in (w_copy, w_flip, w_one, w_extra)],
    "The right half must be a mirror image of the left half: each black square appears the same distance from the dashed line on the other side.")
# 20 Sequence: shaded sectors of a hexagon, two rules
def hexs(black, grey):
    return poly_wheel([INK if i in black else GREY if i == grey else WHITE for i in range(6)])
fr = [({k % 6, (k + 1) % 6}, (2 - 2 * k) % 6) for k in range(5)]
assert fr[4] == ({4, 5}, 0)
assert all(g not in b for b, g in fr)
nvr("Sequences", "Two moving parts", "sequence", SEQ_Q, frame_strip([hexs(*f) for f in fr[:4]]),
    opt(hexs(*fr[4])), [opt(hexs({4, 5}, 2)), opt(hexs({4, 5}, 3)), opt(hexs({3, 4}, 0)), opt(hexs({5, 0}, 2))],
    "The pair of black triangles moves one place clockwise each time. The grey triangle jumps two places anticlockwise each time, so next it is at the top.")


# 21-24: added when Non-Verbal became 3 parts of 8 (migration 058)
from nvr_extra import cube_view, hidden, missing_middle, fold_over
from mock3_lib import lines as _lines
add(**cube_view({(0, 0): "dot", (1, 0): "cross", (1, 1): "grey", (2, 1): "black", (2, 2): "circle", (3, 2): "diamond"}, pick=2))
add(**hidden([(0, 0), (30, 0), (30, 10), (20, 10), (20, 28), (12, 28), (12, 10), (0, 10)],
             [(10, 30, 70, 30), (20, 10, 20, 70), (40, 50, 70, 50), (12, 62, 60, 14), (58, 20, 58, 70)]))
_sq = lambda k, size=None: (lambda s: f'<rect x="{14 + 9 * k - s / 2 + 6}" y="{14 + 9 * k - s / 2 + 6}" width="{s}" height="{s}" fill="{GREY}" stroke="{INK}" stroke-width="2"/>')(8 + 4 * k if size is None else size)
add(**missing_middle([_sq(k) for k in range(5)], [_sq(2, 12), _sq(1, 16), _sq(3, 16), _sq(2, 20)],
    "The square moves one step down and to the right each time and gets 4 units bigger. The middle square is in the middle of its path and middle-sized."))
add(**fold_over([f'<circle cx="18" cy="20" r="6" fill="{INK}"/>',
                 f'<rect x="24" y="40" width="10" height="10" fill="{GREY}" stroke="{INK}" stroke-width="1.5"/>',
                 f'<line x1="12" y1="64" x2="34" y2="56" stroke="{INK}" stroke-width="3"/>']))

S.write(sys.argv[1], "mock-test-2-set-2",
        {"name": "Mock Test 2", "stage": "Challenger", "programmeCode": "GRAMMAR"}, 2,
        [{"subject": "ENGLISH", "sectionOrder": 1, "durationMinutes": 15},
         {"subject": "MATHS", "sectionOrder": 2, "durationMinutes": 15},
         {"subject": "VERBAL", "sectionOrder": 3, "durationMinutes": 10},
         {"subject": "NON_VERBAL", "sectionOrder": 4, "durationMinutes": 10}],
        TITLE, STORY, "Mock Test 2 · Set 2 · Challenger")
