"""Builds Mock Test 3, Set 2 (Challenger): original content only.

Copyright: every passage, question, number and figure in this file was written
for this project. No text is taken or adapted from published 11+ papers,
books or websites, and the essay quotes no one. Question TYPES are common to
all reasoning tests, but each item here is new. Nothing is reused from Mock
Tests 1 or 2 or from Set 1 of this paper.

Usage:  python -I docs/mock-tests/build_mock3_set2.py docs/mock-tests
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fractions import Fraction
from itertools import permutations
from mock_lib import (MockSet, INK, GREY, WHITE, LET, BOX, SIDES, svg, opt, shape, dots, arrow, tf, HFLIP, VFLIP,
                      frame_strip, analogy, matrix, code_stem)
from mock2_lib import small_arrow, unfolded, fold_stem, rot, LIGHT, segs, paper, dashed, hole, curl
from mock3_lib import (cube_dirs, valid_view, net_sym, cube3d, outline, lines, place, mirror_pts, turn_pts,
                       strip_gap, row_of)

S = MockSet(seed=20261125)
add = S.add

# =========================================================================
# ENGLISH - original persuasive essay
# =========================================================================
TITLE = "In Defence of Mistakes"
STORY = """Somewhere in your house, there is probably a rubber. It may be small and grubby, worn down to a nub, with a pencil point stabbed into it during a long and difficult lesson. It is not an exciting object. Nobody has ever asked for one as a birthday present. And yet it may be one of the most honest things you own, because it exists for one reason only: everybody makes mistakes.

We do not always behave as though we believe this. In many classrooms, a cross in the margin feels like a small defeat. A wrong answer said out loud can turn a face red for the rest of the morning. We learn, very early, that being right earns praise and being wrong earns, at best, a sympathetic look. So we start to protect ourselves. We put our hands up only when we are certain. We choose the easy question instead of the interesting one. We stop trying things we might not be good at.

This essay is an argument that we have got it the wrong way round. Mistakes are not the opposite of learning. Very often, they are where learning begins.

Think about how you learned to ride a bike, if you have. Nobody handed you a set of instructions and expected a perfect ride on the first attempt. You wobbled. You fell off. You put a foot down too early, then too late, then at roughly the right moment. Each wobble told your body something that no instruction could: lean a little less, pedal a little faster, look ahead instead of down. If you had refused to wobble, you would still be standing beside the bike, perfectly upright and going nowhere.

The same is true of almost everything worth learning. A wrong answer in a maths problem is not just a wrong answer. It is a clue. It shows exactly where your thinking took a turn it should not have, and that is far more useful than a lucky guess that happened to be right. A teacher who looks carefully at your mistakes can learn more about how your mind works than one who only counts your ticks.

Of course, not every mistake is welcome. Nobody wants a pilot who is "learning from mistakes" during a landing, or a surgeon who is "just having a go". Some situations demand that we get things right first time, and in those situations people practise for years, often making their mistakes somewhere safe, so that they do not make them where it matters. But notice what that means: even the experts we trust the most became expert by getting things wrong, many times, in the right places.

Perhaps the real problem is not mistakes themselves but how we feel about them. If a mistake makes us feel stupid, we hide it, and a hidden mistake teaches nothing. If we can treat it instead as information, as a signpost saying "not this way", then it becomes something we can use. The difference is not in the mistake. It is in us. People who invent, discover or create things tend to know this well. Their notebooks are full of crossings-out, false starts and ideas that did not work, and those messy pages are often the most interesting ones to read.

There is a kind of courage involved in this. It takes courage to say, "I don't understand," in front of other people. It takes courage to attempt the harder question, knowing that you might fail. But that courage is catching. When one person admits they are stuck, others often discover they were stuck too, and the whole room learns something. A classroom where mistakes are allowed is not a careless classroom. It is a brave one.

So here is a modest proposal. The next time you get something wrong, before you reach for the rubber, pause for a moment. Ask yourself what the mistake is trying to tell you. Then rub it out, by all means, and try again.

Just do not rub out the lesson along with it."""

E = "ENGLISH"
def eng(qtype, quest, answer, distractors, explanation):
    add(E, "Comprehension", None, qtype, quest, answer, distractors, explanation)

eng("author's purpose", "Why does the writer begin the essay by describing a rubber?",
    "To use an everyday object to show that everybody makes mistakes",
    ["To advertise a new kind of rubber", "To complain about untidy pencil cases",
     "To explain how rubbers are made", "To suggest that rubbers should be banned"],
    "A rubber 'exists for one reason only: everybody makes mistakes', which sets up the whole argument.")
eng("language effects", "The writer calls the rubber \"one of the most honest things you own\". What does this mean?",
    "It openly admits that mistakes are normal", ["It never breaks", "It was cheap to buy",
     "It belongs to the writer", "It is always telling the truth about spelling"],
    "Its very existence admits that people get things wrong.")
eng("retrieval", "According to the second paragraph, which of these do people do to protect themselves?",
    "Put their hands up only when they are certain", ["Ask for a rubber as a present",
     "Choose the most interesting question", "Practise for years somewhere safe", "Ride a bike without falling off"],
    "'We put our hands up only when we are certain.'")
eng("inference", "What does the writer mean by \"we have got it the wrong way round\"?",
    "We treat mistakes as the enemy of learning when they are often the start of it",
    ["We write our answers in the wrong order", "We hold our pencils upside down",
     "We should learn to ride bikes backwards", "We give praise to the wrong people"],
    "The next sentences explain: 'Mistakes are not the opposite of learning... they are where learning begins.'")
eng("multi-step reasoning", "Why does the writer use the example of learning to ride a bike?",
    "Because most readers will remember that they could only learn it by wobbling and falling",
    ["Because cycling is the writer's favourite hobby", "Because bikes are dangerous",
     "Because it shows that instructions are always useful", "Because it is a lesson taught in schools"],
    "It is a familiar experience in which mistakes clearly taught something no instructions could.")
eng("language effects", "\"perfectly upright and going nowhere\". What point does this phrase make?",
    "Avoiding mistakes completely would also mean never making progress",
    ["Standing still is the safest way to ride a bike", "Good posture is important",
     "The bike was broken", "The rider was too tired to move"],
    "You would avoid falling but also never move: no mistakes, but no learning either.")
eng("vocabulary", "Which word is closest in meaning to \"sympathetic\" as used in the essay?",
    "kind and understanding", ["angry", "confused", "proud", "amused"],
    "A sympathetic look shows someone feels sorry for you and understands.")
eng("retrieval", "According to the writer, why is a wrong answer in maths \"a clue\"?",
    "It shows exactly where your thinking went wrong", ["It is always nearly right",
     "It tells the teacher you were not trying", "It can be rubbed out easily", "It shows you guessed"],
    "'It shows exactly where your thinking took a turn it should not have.'")
eng("viewpoint", "How does the writer feel about lucky guesses?",
    "They are less useful than a wrong answer that shows how you were thinking",
    ["They are the best way to learn", "They should be rewarded with extra ticks",
     "They show that the pupil is clever", "They are a kind of cheating"],
    "A mistake is 'far more useful than a lucky guess that happened to be right'.")
eng("structure", "Why does the writer include the paragraph about pilots and surgeons?",
    "To admit that some mistakes are not acceptable, which makes the argument more balanced",
    ["To show that pilots and surgeons are careless", "To change the subject completely",
     "To prove that mistakes are always dangerous", "To suggest that readers should become surgeons"],
    "'Of course, not every mistake is welcome' answers an obvious objection before a reader can raise it.")
eng("inference", "What does the writer suggest experts do so that they do not make mistakes where it matters?",
    "Practise a great deal and make their mistakes somewhere safe",
    ["Never practise in case they get things wrong", "Ask somebody else to do the difficult parts",
     "Avoid all difficult situations", "Rely on luck"],
    "'People practise for years, often making their mistakes somewhere safe.'")
eng("multi-step reasoning", "\"a hidden mistake teaches nothing\". Why might this be true?",
    "If nobody looks at the mistake, nobody can learn what caused it",
    ["Because hidden mistakes disappear by themselves", "Because teachers cannot mark them",
     "Because mistakes are always obvious", "Because only spoken mistakes count"],
    "To learn from a mistake you have to examine it; hiding it removes that chance.")
eng("language effects", "The writer describes a mistake as \"a signpost saying 'not this way'\". What does this metaphor suggest?",
    "A mistake can guide you towards the right path", ["Mistakes are found by the side of roads",
     "You should always turn back when you are lost", "Mistakes are written in large letters",
     "You should ignore mistakes and carry on"], "A signpost directs travellers; a mistake points you away from a wrong route.")
eng("inference", "The writer says that courage is \"catching\". What does this mean?",
    "When one person is brave, others are encouraged to be brave too",
    ["Courage is a kind of illness", "Brave people are good at catching balls",
     "Only some people can ever be brave", "Courage is easy to lose"],
    "Like a cold spreading, one person admitting they are stuck helps others to admit it too.")
eng("viewpoint", "What, according to the writer, is a classroom where mistakes are allowed?",
    "A brave one", ["A careless one", "A noisy one", "A dangerous one", "An unusual one"],
    "'A classroom where mistakes are allowed is not a careless classroom. It is a brave one.'")
eng("language effects", "Why does the writer call the suggestion near the end \"a modest proposal\"?",
    "To show it is a small, simple step that anyone could take",
    ["To show that the writer is not sure it will work", "To ask the reader for money",
     "To suggest that the idea is old-fashioned", "To make the idea sound very important"],
    "Pausing before rubbing out is a small, achievable action rather than a big change.")
eng("structure", "How does the final sentence link back to the start of the essay?",
    "It returns to the rubber, warning us not to erase what the mistake taught us",
    ["It describes buying a new rubber", "It introduces a new argument about pencils",
     "It disagrees with the opening paragraph", "It lists all the writer's own mistakes"],
    "The essay opens and closes with the rubber, ending on the idea of keeping the lesson.")
eng("author's purpose", "What is the main purpose of the essay?",
    "To persuade readers to see mistakes as a useful part of learning",
    ["To teach readers how to ride a bike", "To explain how surgeons are trained",
     "To argue that tests should be harder", "To describe a day in a classroom"],
    "Every paragraph supports the claim that mistakes, treated well, help us learn.")

# =========================================================================
# MATHS
# =========================================================================
M = "MATHS"
assert 7254 + 3869 == 11123
add(M, "Number", "Addition", "calculation", "What is 7,254 + 3,869?",
    "11,123", ["10,123", "11,023", "11,113", "12,123"], "7,254 + 3,869 = 11,123.")
assert 2856 // 12 == 238 and 2856 % 12 == 0
add(M, "Number", "Division", "calculation", "What is 2,856 ÷ 12?",
    "238", ["228", "248", "283", "2,380"], "12 × 200 = 2,400; 456 ÷ 12 = 38. So 238.")
assert Fraction(3, 4) / Fraction(3, 8) == 2
add(M, "Fractions", "Dividing fractions", "calculation", "What is 3/4 ÷ 3/8?",
    "2", ["9/32", "1/2", "6/12", "3/2"], "Dividing by 3/8 is multiplying by 8/3: 3/4 × 8/3 = 24/12 = 2.")
assert Fraction(2, 5) < Fraction(3, 7) < Fraction(4, 9) < Fraction(1, 2) < Fraction(5, 9)
add(M, "Fractions", "Ordering fractions", "reasoning", "Which of these fractions is the largest?\n2/5   3/7   4/9   1/2   5/9",
    "5/9", ["2/5", "3/7", "4/9", "1/2"], "5/9 is the only one greater than 1/2; the others are all less than a half.")
assert Fraction(45, 60) == Fraction(75, 100)
add(M, "Percentages", "Finding the percentage", "word problem", "A school trip has 60 places and 45 have been booked. What percentage has been booked?",
    "75%", ["45%", "15%", "25%", "80%"], "45/60 = 3/4 = 75%.")
assert 30 * Fraction(4, 100) * 3 == Fraction(18, 5)
add(M, "Percentages", "Simple interest", "word problem", "Lily saves £30. Each year she earns 4% of £30 in interest. How much interest does she earn in 3 years?",
    "£3.60", ["£1.20", "£12", "£33.60", "£4.80"], "4% of £30 = £1.20 a year; 3 × £1.20 = £3.60.")
assert 35 * Fraction(2, 7) == 10 and 35 - 10 == 25
add(M, "Ratio", "Ratio problems", "word problem", "In a class the ratio of boys to girls is 2 : 5. There are 35 children. How many more girls than boys are there?",
    "15", ["25", "10", "3", "7"], "7 parts = 35, so one part is 5. Boys 10, girls 25: 25 − 10 = 15.")
assert 2 * (3 + 4) ** 2 == 98
add(M, "Algebra", "Substitution", "calculation", "If p = 3 and q = 4, what is 2(p + q)²?",
    "98", ["196", "50", "28", "56"], "p + q = 7; 7² = 49; 2 × 49 = 98.")
seq = [1, 4, 9, 16, 25]; assert seq == [n * n for n in range(1, 6)] and 15 * 15 == 225
add(M, "Algebra", "Sequences", "pattern", "What is the 15th term of the sequence 1, 4, 9, 16, 25, …?",
    "225", ["30", "196", "256", "75"], "The terms are the square numbers, so the 15th is 15² = 225.")
d = [6, 9, 9, 12, 14]; assert sorted(d)[2] == 9 and max(set(d), key=d.count) == 9
add(M, "Statistics", "Averages", "reasoning", "For the numbers 12, 9, 6, 14 and 9, which statement is true?",
    "The median and the mode are both 9", ["The median is 6", "The mode is 14", "The range is 6", "The mean is 9"],
    "In order: 6, 9, 9, 12, 14. Median 9, mode 9, range 8, mean 50 ÷ 5 = 10.")
assert sum(d) / 5 == 10 and max(d) - min(d) == 8
assert 3 * 2 * 4 == 24
CIRC = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="280" height="196">'
        '<rect x="20" y="30" width="160" height="80" fill="#e0f2fe" stroke="#1f2937" stroke-width="2"/>'
        '<circle cx="70" cy="70" r="40" fill="#ffffff" stroke="#1f2937" stroke-width="2"/>'
        '<circle cx="130" cy="70" r="40" fill="#ffffff" stroke="#1f2937" stroke-width="2"/>'
        '<text x="100" y="24" font-size="11" text-anchor="middle" fill="#1f2937">16 cm</text>'
        '<text x="100" y="135" font-size="9" text-anchor="middle" fill="#6b7280">Not drawn to scale</text></svg>')
add(M, "Shape", "Using diagrams", "diagram",
    "Two equal circles fit exactly inside a rectangle 16 cm long, touching each other and the sides. What is the radius of each circle?",
    "4 cm", ["8 cm", "5 cm", "16 cm", "2 cm"], "Two diameters fit along 16 cm, so each diameter is 8 cm and the radius is 4 cm.", stem=CIRC)
assert 16 / 2 / 2 == 4
assert 2 * (9 * 4 + 9 * 2 + 4 * 2) == 124
add(M, "Shape", "Surface area", "calculation", "A cuboid is 9 cm long, 4 cm wide and 2 cm tall. What is its total surface area?",
    "124 cm²", ["72 cm²", "62 cm²", "15 cm²", "144 cm²"], "Faces: 2 × (9×4) + 2 × (9×2) + 2 × (4×2) = 72 + 36 + 16 = 124 cm².")
assert 180 - 2 * 65 == 50
add(M, "Shape", "Angles", "reasoning", "In an isosceles triangle the two base angles are each 65°. What is the top angle?",
    "50°", ["65°", "115°", "130°", "25°"], "180 − 65 − 65 = 50°.")
assert 2.5 * 1000 / 250 == 10
add(M, "Measures", "Mass", "word problem", "A sack holds 2.5 kg of rice. How many 250 g portions can be made from it?",
    "10", ["100", "25", "1", "4"], "2.5 kg = 2,500 g; 2,500 ÷ 250 = 10.")
assert (8 * 60 + 15) + 3 * 50 + 2 * 10 == 11 * 60 + 5
add(M, "Measures", "Timetables", "multi-step",
    "School starts at 08:15. There are three lessons of 50 minutes, with a 10-minute break after the first and after the second. When does the third lesson end?",
    "11:05", ["10:45", "11:15", "10:55", "11:25"], "3 × 50 = 150 min and 2 × 10 = 20 min: 170 min = 2 h 50 min after 08:15, which is 11:05.")
mult = [n for n in range(1, 100) if n % 6 == 0 and n % 8 == 0]; assert mult[0] == 24
add(M, "Number", "Lowest common multiple", "reasoning", "What is the lowest common multiple of 6 and 8?",
    "24", ["48", "14", "2", "12"], "Multiples of 8: 8, 16, 24 … and 24 is the first that 6 also divides.")
assert -3 - (-8) == 5
add(M, "Number", "Negative numbers", "calculation", "What is −3 − (−8)?",
    "5", ["−11", "11", "−5", "−24"], "Taking away a negative is the same as adding: −3 + 8 = 5.")
add(M, "Shape", "Symmetry", "reasoning", "How many lines of symmetry does a regular hexagon have?",
    "6", ["3", "4", "2", "12"], "A regular hexagon has 3 lines through opposite corners and 3 through the middles of opposite sides.")
assert Fraction(1, 2) * Fraction(1, 6) == Fraction(1, 12)
add(M, "Statistics", "Probability", "reasoning", "A coin is tossed and a fair dice is rolled. What is the probability of getting a head and a 6?",
    "1/12", ["1/8", "2/6", "7/12", "1/6"], "1/2 × 1/6 = 1/12. (There are 12 equally likely outcomes and only one is head-and-6.)")
n = 8; assert 5 * n + 3 * (n + 2) == 70
add(M, "Algebra", "Forming equations", "multi-step",
    "Pens cost n pence and pencils cost 2p more than pens. Five pens and three pencils cost 70p. How much is a pen?",
    "8p", ["10p", "7p", "6p", "14p"], "5n + 3(n + 2) = 70 → 8n + 6 = 70 → 8n = 64 → n = 8.")

# =========================================================================
# VERBAL REASONING
# =========================================================================
V = "VERBAL"
pairswap = lambda w: "".join(w[i + 1] + w[i] for i in range(0, len(w) - 1, 2)) + (w[-1] if len(w) % 2 else "")
assert pairswap("GARDEN") == "AGDRNE"
ans = pairswap("PLANET"); assert ans == "LPNATE"
add(V, "Codes", "Swapped pairs", "letter code",
    "In a code, GARDEN is written as AGDRNE. How would PLANET be written in the same code?",
    ans, ["TENALP", "LPANTE", "PLNAET", "LNPATE"], "The letters are swapped in pairs: PL→LP, AN→NA, ET→TE.")
VN = {"A": "1", "E": "2", "I": "3", "O": "4", "U": "5"}
mix = lambda w: "".join(VN[c] if c in VN else chr(ord(c) + 1) for c in w)
assert mix("BREAD") == "CS21E"
ans = mix("GHOST"); assert ans == "HI4TU"
add(V, "Codes", "Mixed code", "letter code",
    "In a code, BREAD is written as CS21E. How would GHOST be written in the same code?",
    ans, ["HI5TU", "FG4RS", "HI4UV", "GH4ST"],
    "Vowels become numbers (A=1, E=2, I=3, O=4, U=5) and every consonant moves forward one letter: G→H, H→I, O→4, S→T, T→U.")
s = ["B"]; [s.append(chr(ord(s[-1]) + g)) for g in (2, 3, 4, 5, 6)]; assert s == ["B", "D", "G", "K", "P", "V"]
add(V, "Series", "Letter series", "letter series", "Find the next letter: B, D, G, K, P, ?",
    "V", ["U", "W", "T", "X"], "The gaps grow by one: +2, +3, +4, +5, so next is +6: P → V.")
s = [n * (n + 1) for n in (1, 3, 5, 7, 9)]; assert s == [2, 12, 30, 56, 90]
add(V, "Series", "Number series", "number series", "Find the next number: 2, 12, 30, 56, ?",
    "90", ["82", "86", "84", "100"], "The differences are 10, 18, 26, going up by 8, so next is 34: 56 + 34 = 90.")
s = [50, 2, 45, 4, 40, 8]; assert s[0::2] == [50, 45, 40] and s[1::2] == [2, 4, 8]
add(V, "Series", "Two series", "number series", "Find the next number: 50, 2, 45, 4, 40, 8, ?",
    "35", ["16", "36", "30", "12"], "Two series take turns: 50, 45, 40, 35 goes down by 5; 2, 4, 8 doubles. Next is 35.")
avg = lambda a, b: (a + b) // 2
assert avg(8, 4) == 6 and avg(10, 4) == 7 and avg(20, 6) == 13
add(V, "Number", "Related numbers", "missing number",
    "The numbers in each group are related in the same way. Find the missing number.\n8 (6) 4     10 (7) 4     20 ( ? ) 6",
    "13", ["14", "26", "120", "12"], "The middle number is halfway between the outside numbers: (20 + 6) ÷ 2 = 13.")
assert {"flat", "time", "beat", "tide"} >= {"fla" + "t", "t" + "ime", "bea" + "t", "t" + "ide"}
add(V, "Word building", "Shared letter", "missing letter",
    "Which letter ends the first word and starts the second word in BOTH pairs?\nfla ( ? ) ime        bea ( ? ) ide",
    "t", ["n", "p", "w", "r"], "flat, time and beat, tide. No other letter makes four real words.")
assert "W" + "EAT" + "HER" == "WEATHER"
add(V, "Word building", "Missing three letters", "missing word",
    "Three letters that make a word have been taken out of the word in capitals. Which three letters complete it?\nThe WHER was warm and sunny all week.",
    "EAT", ["ARE", "OAT", "ITS", "AIL"], "W + EAT + HER = WEATHER.")
for w in ("print", "step", "ball"):
    assert "foot" + w in {"footprint", "footstep", "football"}
add(V, "Word building", "Compound words", "compound word",
    "Which word can go in front of all of these to make three new words?  ___print   ___step   ___ball",
    "foot", ["finger", "hand", "snow", "door"], "footprint, footstep, football. Each of the others fails with at least one.")
add(V, "Vocabulary", "Antonyms", "antonym", "Which word is most nearly the OPPOSITE of TRANQUIL?",
    "agitated", ["peaceful", "silent", "distant", "gentle"], "Tranquil means calm; agitated means troubled and restless.")
add(V, "Vocabulary", "Synonyms", "synonym", "Which word is closest in meaning to DILIGENT?",
    "hard-working", ["lazy", "clever", "polite", "quick"], "Diligent means showing care and effort in your work.")
add(V, "Vocabulary", "Odd two out", "classification",
    "Three of these words go together. Which TWO do not belong?\nkitten   puppy   calf   mare   ewe",
    "mare, ewe", ["kitten, calf", "puppy, mare", "calf, ewe", "kitten, puppy"], "Kitten, puppy and calf are young animals. A mare and a ewe are adult females.")
cols = ["red", "blue", "green"]
sol = [p for p in permutations(cols)  # houses 1, 2, 3 left to right
       if p.index("green") == p.index("blue") + 1 and p[2] != "red"]
assert len(sol) == 1 and sol[0] == ("red", "blue", "green")
add(V, "Logic", "Houses", "logic",
    "Three houses stand in a row: one red, one blue and one green. The green house is immediately to the right of the blue house. The red house is not on the right. Which colour is the house on the left?",
    "red", ["blue", "green", "It could be blue or red", "It cannot be worked out"],
    "Blue and green must be next to each other, in houses 1–2 or 2–3. If they were 1–2, red would be on the right, which is not allowed. So blue and green are 2 and 3, and red is on the left.")
days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
assert days[(0 + 10) % 7] == "Thursday"
add(V, "Logic", "Days", "logic", "Yesterday was the day before Monday. What day will it be in 10 days' time?",
    "Thursday", ["Wednesday", "Friday", "Monday", "Sunday"], "Yesterday was Sunday, so today is Monday. 10 days = 1 week + 3 days: Thursday.")
assert all(sorted(w) == sorted("setn") for w in ("nest", "tens", "sent", "nets"))
add(V, "Word building", "Anagrams", "anagram",
    "Rearrange the letters in capitals to make a word that completes the sentence sensibly.\nThe robin built its SETN in the hedge.",
    "nest", ["tens", "sent", "nets", "stem"], "SETN can make NEST, TENS, SENT or NETS, but only a NEST makes sense.")
base = "THUNDERSTORM"
def can_make(word, base):
    return all(word.upper().count(c) <= base.count(c) for c in set(word.upper()))
opts = ["trumpet", "monster", "thunder", "modern", "hunters"]
assert [w for w in opts if not can_make(w, base)] == ["trumpet"]
add(V, "Word building", "Letters from a word", "word making",
    "Which word can NOT be made using only the letters of THUNDERSTORM? (Each letter may be used only as many times as it appears.)",
    "trumpet", ["monster", "thunder", "modern", "hunters"], "THUNDERSTORM has no P, so TRUMPET cannot be made.")
add(V, "Vocabulary", "Analogies", "analogy", "Doctor is to hospital as chef is to ?",
    "kitchen", ["food", "cook", "apron", "menu"], "A doctor works in a hospital; a chef works in a kitchen.")
diff = lambda a, b: sum(x != y for x, y in zip(a, b))
opts = ["BEAT", "BEAD", "BRAT", "BEAK", "BEAM"]
assert [w for w in opts if diff("BEAR", w) == 1 and diff(w, "BOAT") == 1] == ["BEAT"]
add(V, "Word building", "Word ladders", "word ladder",
    "Change one letter at a time to turn BEAR into BOAT. Which word could go in the middle?\nBEAR → ? → BOAT",
    "BEAT", ["BEAD", "BRAT", "BEAK", "BEAM"], "BEAR → BEAT (R to T) → BOAT (E to O).")
g = lambda n: n * n + 1; assert g(3) == 10 and g(5) == 26 and g(7) == 50
add(V, "Number", "Number pairs", "missing number",
    "Find the number that completes the third pair in the same way as the first two.\n(3 → 10)   (5 → 26)   (7 → ?)",
    "50", ["42", "49", "36", "22"], "Square the number and add 1: 9 + 1, 25 + 1, 49 + 1 = 50.")
x, y = 0, 0; x, y = x, y + 3; x, y = x + 2, y; x, y = x, y - 3; assert (x, y) == (2, 0)
add(V, "Logic", "Directions", "logic",
    "Sam walks 3 km north, turns right and walks 2 km, then turns right again and walks 3 km. In which direction is he now from where he started?",
    "East", ["West", "North", "South", "North-east"], "North 3, then east 2, then south 3 brings him back level with the start, 2 km to the east.")

# =========================================================================
# NON-VERBAL REASONING
# =========================================================================
N = "NON_VERBAL"
def nvr(topic, sub, qtype, quest, stem, answer, distractors, explanation, option_format="svg"):
    add(N, topic, sub, qtype, quest, answer, distractors, explanation, stem=stem, option_format=option_format)

SEQ_Q = "Which figure comes next in the sequence?"
ODD_Q = "Which figure is the odd one out?"
AN_Q = "The first figure changes into the second. Which option changes in the same way from the third figure?"

# 1 Hexagon: thick side jumps two places clockwise; one dot fewer each time
def hexv(i, r=30):
    a = math.radians(-90 + 60 * i)
    return 40 + r * math.cos(a), 40 + r * math.sin(a)
def thick_hex(side, n):
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in (hexv(i) for i in range(6)))
    (x1, y1), (x2, y2) = hexv(side), hexv(side + 1)
    return (f'<polygon points="{pts}" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
            + dots(n, r=3, gap=9, cols=3))
fr = [((2 * k) % 6, 5 - k) for k in range(5)]; assert fr[4] == (2, 1)
nvr("Sequences", "Two rules", "sequence", SEQ_Q, frame_strip([thick_hex(*f) for f in fr[:4]]),
    opt(thick_hex(2, 1)), [opt(thick_hex(1, 1)), opt(thick_hex(2, 2)), opt(thick_hex(4, 1)), opt(thick_hex(0, 1))],
    "The thick side jumps two sides clockwise each time and there is one dot fewer. Next: the thick side is at the bottom right and there is 1 dot.")
# 2 Two arrows turning different ways at different speeds
def two_arrows(a, b):
    return small_arrow(24, 40, a, s=0.5) + small_arrow(56, 40, b, s=0.5, fill=WHITE)
fr = [(90 * k % 360, (-45 * k) % 360) for k in range(5)]; assert fr[4] == (0, 180)
nvr("Sequences", "Two speeds", "sequence", SEQ_Q, frame_strip([two_arrows(*f) for f in fr[:4]]),
    opt(two_arrows(0, 180)), [opt(two_arrows(180, 0)), opt(two_arrows(0, 0)), opt(two_arrows(90, 180)), opt(two_arrows(0, 225))],
    "The black arrow turns 90° clockwise each time; the white arrow turns 45° anticlockwise. Next the black arrow points up and the white arrow points down.")
# 3 Missing middle: arrow turns 60°, shading alternates
cells = [arrow(60 * k, INK if k % 2 == 0 else WHITE) for k in range(5)]
nvr("Sequences", "Missing middle", "sequence", "Which figure is missing from the middle of the sequence?",
    strip_gap(cells, 2), opt(cells[2]), [opt(arrow(120, WHITE)), opt(arrow(90, INK)), opt(arrow(150, INK)), opt(arrow(240, INK))],
    "The arrow turns 60° clockwise each time and alternates black and white. The middle figure is black and turned 120°.")
# 4 Grid 4 x 4: black square jumps 3 places in reading order, grey square steps back 1
def g4(black, grey):
    out = []
    for i in range(16):
        r, c = divmod(i, 4)
        f = INK if i == black else GREY if i == grey else WHITE
        out.append(f'<rect x="{12 + c * 14}" y="{12 + r * 14}" width="14" height="14" fill="{f}" stroke="#9ca3af" stroke-width="1.2"/>')
    return "".join(out)
fr = [(3 * k, 15 - k) for k in range(5)]; assert all(b != g for b, g in fr) and fr[4] == (12, 11)
nvr("Sequences", "Two moving parts", "sequence", SEQ_Q, frame_strip([g4(*f) for f in fr[:4]]),
    opt(g4(12, 11)), [opt(g4(11, 12)), opt(g4(12, 10)), opt(g4(13, 11)), opt(g4(12, 3))],
    "Reading the grid like a page, the black square moves on 3 places each time and the grey square moves back 1. Next: black at the start of the bottom row, grey at the end of the row above.")
# 5 Odd one out: the angle is less than a right angle
def angle_fig(start, opening):
    a1, a2 = math.radians(start), math.radians(start + opening)
    x0, y0 = 22, 58
    return (f'<line x1="{x0}" y1="{y0}" x2="{x0 + 46 * math.cos(a1):.1f}" y2="{y0 - 46 * math.sin(a1):.1f}" stroke="{INK}" stroke-width="3"/>'
            f'<line x1="{x0}" y1="{y0}" x2="{x0 + 46 * math.cos(a2):.1f}" y2="{y0 - 46 * math.sin(a2):.1f}" stroke="{INK}" stroke-width="3"/>'
            f'<circle cx="{x0}" cy="{y0}" r="3" fill="{INK}"/>')
good = [(0, 50), (10, 70), (20, 35), (0, 80)]
assert all(o < 90 for _, o in good)
nvr("Odd one out", "Angles", "odd one out", ODD_Q, None,
    opt(angle_fig(-10, 115)), [opt(angle_fig(*g)) for g in good],
    "In four figures the two lines make an angle smaller than a right angle. In the odd one out the angle is bigger than a right angle.")
# 6 Odd one out: the arrow points at the shape with the most sides
SPOT = {0: (40, 14), 1: (64, 58), 2: (16, 58)}
def point_most(kinds, target):
    out = "".join(shape(k, cx=SPOT[i][0], cy=SPOT[i][1], r=10, fill=WHITE) for i, k in enumerate(kinds))
    x, y = SPOT[target]
    a = math.degrees(math.atan2(x - 40, -(y - 42))) % 360
    return out + small_arrow(40, 42, round(a), s=0.36)
good = [(("triangle", "hexagon", "square"), 1), (("pentagon", "triangle", "heptagon"), 2),
        (("octagon", "square", "pentagon"), 0), (("square", "triangle", "pentagon"), 2)]
def most(kinds):
    return max(range(3), key=lambda i: SIDES.get(kinds[i], 99))
assert all(most(k) == t for k, t in good)
oddk = ("hexagon", "square", "triangle"); assert most(oddk) == 0
nvr("Odd one out", "Direction", "odd one out", ODD_Q, None,
    opt(point_most(oddk, 2)), [opt(point_most(k, t)) for k, t in good],
    "In four figures the arrow points at the shape with the most sides. In the odd one out it points at the triangle instead of the hexagon.")
# 7 Odd one out: the black circle is the middle-sized one
def three_circ(sizes, black):
    xs = (18, 40, 62)
    return "".join(f'<circle cx="{x}" cy="40" r="{r}" fill="{INK if i == black else WHITE}" stroke="{INK}" stroke-width="2"/>'
                   for i, (x, r) in enumerate(zip(xs, sizes)))
good = [((6, 10, 14), 1), ((14, 6, 10), 2), ((10, 14, 6), 0), ((6, 14, 10), 2)]
assert all(sorted(s).index(s[b]) == 1 for s, b in good)
nvr("Odd one out", "Size", "odd one out", ODD_Q, None,
    opt(three_circ((10, 6, 14), 1)), [opt(three_circ(*g)) for g in good],
    "In four figures the black circle is the middle-sized one. In the odd one out the black circle is the smallest.")
# 8 Analogy: colours move one place to the right
def row3(kind, fills):
    return "".join(shape(kind, fill=f, cx=x, cy=40, r=10) for f, x in zip(fills, (17, 40, 63)))
sh = lambda f: [f[-1]] + f[:-1]
a = [INK, GREY, WHITE]; c = [GREY, WHITE, INK]
nvr("Analogies", "Moving colours", "analogy", AN_Q,
    analogy(row3("square", a), row3("square", sh(a)), row3("circle", c)),
    opt(row3("circle", sh(c))), [opt(row3("circle", sh(sh(c)))), opt(row3("circle", c[::-1])), opt(row3("square", sh(c))), opt(row3("circle", [GREY, INK, WHITE]))],
    "Each colour moves one place to the right and the last colour wraps round to the front. Grey, white, black becomes black, grey, white.")
assert sh(c) == [INK, GREY, WHITE]
# 9 Analogy: number of sides doubles
assert SIDES["triangle"] * 2 == SIDES["hexagon"] and SIDES["square"] * 2 == SIDES["octagon"]
nvr("Analogies", "Counting sides", "analogy", AN_Q,
    analogy(shape("triangle", fill=GREY, r=28), shape("hexagon", fill=GREY, r=28), shape("square", fill=INK, r=28)),
    opt(shape("octagon", fill=INK, r=28)), [opt(shape("pentagon", fill=INK, r=28)), opt(shape("hexagon", fill=INK, r=28)),
                                              opt(shape("octagon", fill=GREY, r=28)), opt(shape("heptagon", fill=INK, r=28))],
    "The number of sides doubles and the colour stays the same: 3 → 6, so 4 → 8.")
# 10 Matrix 3 x 3: column sets the outer shape, row sets its shading, inner shape cycles
OUTER = ["circle", "square", "hexagon"]
FILL = [WHITE, LIGHT, GREY]
INNER = ["dot", "cross", "triangle"]
def inner(k):
    if k == "dot":
        return f'<circle cx="40" cy="40" r="5" fill="{INK}"/>'
    if k == "cross":
        return lines([(33, 33, 47, 47), (47, 33, 33, 47)], 3)
    return shape("triangle", fill=WHITE, r=9)
def cellf(o, f, i):
    return shape(o, fill=f, r=30) + inner(i)
cells = [cellf(OUTER[c], FILL[r], INNER[(r + c) % 3]) for r in range(3) for c in range(3)]
nvr("Matrices", "Three features", "matrix", "Which option completes the grid?", matrix(cells[:-1], 3),
    opt(cellf("hexagon", GREY, "cross")), [opt(cellf("hexagon", GREY, "dot")), opt(cellf("hexagon", LIGHT, "cross")),
                                           opt(cellf("square", GREY, "cross")), opt(cellf("hexagon", GREY, "triangle"))],
    "Each column has the same outer shape, each row has the same shading, and every row and column has one dot, one cross and one triangle. The missing cell is a grey hexagon with a cross.")
assert INNER[(2 + 2) % 3] == "cross"
# 11 Matrix: third = first with the second's lines taken away
rows = [({"V", "H", "D1"}, {"H"}), ({"T", "O", "D2"}, {"O"}), ({"V", "D1", "D2", "O"}, {"D1", "O"})]
cells = []
for a1, b1 in rows:
    cells += [segs(a1), segs(b1), segs(a1 - b1)]
last = rows[2][0] - rows[2][1]; assert last == {"V", "D2"}
nvr("Matrices", "Taking away", "matrix", "Which option completes the grid?", matrix(cells[:-1], 3),
    opt(segs(last)), [opt(segs({"D1", "O"})), opt(segs({"V", "D1", "D2", "O"})), opt(segs({"V"})), opt(segs({"V", "D2", "O"}))],
    "In each row the third figure is the first figure with the lines of the second figure taken away.")
# 12 Reflection in a mirror line to the left
F = (f'<polygon points="16,16 64,16 64,30 34,30 34,64 16,64" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
     f'<circle cx="52" cy="50" r="8" fill="{WHITE}" stroke="{INK}" stroke-width="2"/><circle cx="52" cy="50" r="3" fill="{INK}"/>')
left_stem = svg(f'<line x1="6" y1="4" x2="6" y2="86" stroke="{INK}" stroke-width="2" stroke-dasharray="5,4"/>'
                f'<g transform="translate(12,5)">{F}</g>', 96, 90)
nvr("Reflection", "Mirror to the left", "reflection", "Which option shows the figure reflected in the dashed mirror line to its left?",
    left_stem, opt(tf(F, HFLIP)), [opt(F), opt(tf(F, VFLIP)), opt(rot(F, 180)), opt(rot(F, 270))],
    "A vertical mirror swaps left and right but keeps top and bottom: the long bar stays at the top and the ring moves to the left.")
# 13 Turn 90° anticlockwise, then reflect top to bottom
H = (f'<polygon points="14,40 30,20 30,32 62,32 62,48 30,48 30,60" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
     f'<rect x="48" y="14" width="12" height="12" fill="{INK}"/>')
nvr("Rotation", "Two steps", "rotation",
    "The figure is turned 90° anticlockwise and then reflected top to bottom. Which option shows the result?",
    frame_strip([H], question=False),
    opt(tf(rot(H, -90), VFLIP)), [opt(rot(H, -90)), opt(rot(tf(H, VFLIP), -90)), opt(tf(H, HFLIP)), opt(rot(H, 90))],
    "After the quarter turn anticlockwise the arrow points down and the square is at the top left. Reflecting top to bottom then makes the arrow point up and moves the square to the bottom left.")
# 14 Two folds in the same direction (like a fan), punch, unfold
hq = [(17, 30), (20, 55)]
def fan_unfold(hs):
    out = set()
    for x, y in hs:
        for X in (x, 50 - x):
            for XX in (X, 80 - X):
                out.add((XX, y))
    return sorted(out)
ans = fan_unfold(hq); assert len(ans) == 8
steps = [paper(10, 10, 60, 60) + dashed(40, 6, 40, 74) + curl(62, 30, 22, 30),
         paper(10, 10, 30, 60) + dashed(25, 6, 25, 74) + curl(36, 40, 14, 40),
         paper(10, 10, 15, 60) + "".join(hole(x, y, 3.5) for x, y in hq)]
w1 = sorted({(x, y) for x, y in hq} | {(80 - x, y) for x, y in hq})
w2 = sorted({(X, y) for x, y in hq for X in (x, 50 - x)})
w3 = sorted({(x + k, y) for x, y in hq for k in (0, 15, 30, 45)})
w4 = sorted(set(ans) - {(63, 30)})
assert len({tuple(ans), tuple(w1), tuple(w2), tuple(w3), tuple(w4)}) == 5
nvr("Folding", "Fan folds", "paper folding",
    "A square of paper is folded in half from right to left, then the folded edge is folded back over to the left again, as shown. Two holes are punched. What does the paper look like when it is unfolded?",
    fold_stem(steps), opt(unfolded(ans)), [opt(unfolded(w)) for w in (w1, w2, w3, w4)],
    "Each hole goes through four layers, so there are 8 holes in two rows of four. Each unfold mirrors the holes in that fold line.")
# 15 Which cube can be made from the net?
cells = {(0, 0): "dot", (0, 1): "grey", (1, 1): "cross", (1, 2): "black", (2, 2): "circle", (2, 3): "diamond"}
d = cube_dirs(cells)
views = [("grey", "cross", "black"), ("cross", "black", "circle"), ("black", "circle", "diamond"),
         ("dot", "grey", "cross"), ("grey", "black", "cross"), ("cross", "circle", "black"),
         ("dot", "cross", "black"), ("grey", "circle", "black")]
good_views = [v for v in views if valid_view(d, *v)]
bad_views = [v for v in views if not valid_view(d, *v)]
assert good_views and len(bad_views) >= 4, (good_views, bad_views)
right_view = good_views[0]
nvr("Cubes", "Nets to cubes", "cube net", "Which cube could be made by folding this net?",
    net_sym(cells), opt(cube3d(*right_view)), [opt(cube3d(*v)) for v in bad_views[:4]],
    "Work out which faces are opposite: they can never be seen together. Then check the order of the three faces round the corner: some options show possible faces in a mirror-image order.")
# 16 Codes: three letters - outer shape, number of lines, dot position
OUT = {"circle": "A", "square": "B"}
NL = {1: "P", 2: "Q", 3: "R"}
DOTP = {"top": "X", "bottom": "Y"}
def c3(kind, n, pos):
    ls = [(40 + (i - (n - 1) / 2) * 9, 30, 40 + (i - (n - 1) / 2) * 9, 50) for i in range(n)]
    dy = 18 if pos == "top" else 62
    return shape(kind, r=30) + lines(ls, 2.5) + f'<circle cx="40" cy="{dy}" r="3.5" fill="{INK}"/>'
ex = [("circle", 1, "top"), ("square", 2, "top"), ("circle", 3, "bottom"), ("square", 1, "bottom")]
nvr("Codes", "Three-letter codes", "code",
    "Each figure has a three-letter code. Work out what each letter stands for. What is the code for the last figure?",
    code_stem([(c3(*e), OUT[e[0]] + NL[e[1]] + DOTP[e[2]]) for e in ex], c3("square", 3, "top")),
    "BRX", ["BRY", "ARX", "BQX", "RBX"],
    "First letter: shape (A circle, B square). Second: number of lines (P one, Q two, R three). Third: where the dot is (X top, Y bottom). So BRX.",
    option_format="text")
# 17 Similarity: the dot is inside both shapes
def overlap(dot, sq=(30, 22, 34), circ=(30, 46, 18)):
    x, y, s = sq
    cx, cy, r = circ
    return (f'<rect x="{x}" y="{y}" width="{s}" height="{s}" fill="none" stroke="{INK}" stroke-width="2"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{INK}" stroke-width="2"/>'
            f'<circle cx="{dot[0]}" cy="{dot[1]}" r="3.5" fill="{INK}"/>')
def in_sq(p, sq=(30, 22, 34)):
    return sq[0] < p[0] < sq[0] + sq[2] and sq[1] < p[1] < sq[1] + sq[2]
def in_c(p, circ=(30, 46, 18)):
    return math.dist(p, circ[:2]) < circ[2]
both = [(38, 44), (40, 50)]
assert all(in_sq(p) and in_c(p) for p in both)
cands = {"ans": (36, 52), "sq_only": (56, 30), "c_only": (20, 56), "neither": (66, 66), "edge": (14, 30)}
assert in_sq(cands["ans"]) and in_c(cands["ans"])
assert in_sq(cands["sq_only"]) and not in_c(cands["sq_only"])
assert in_c(cands["c_only"]) and not in_sq(cands["c_only"])
assert not in_sq(cands["neither"]) and not in_c(cands["neither"]) and not in_sq(cands["edge"]) and not in_c(cands["edge"])
nvr("Similarities", "Find the rule", "similarity", "Which option is most like the two figures on the left?",
    row_of([overlap(both[0]), rot(overlap(both[1]), 90)]),
    opt(rot(overlap(cands["ans"]), 180)),
    [opt(overlap(cands["sq_only"])), opt(rot(overlap(cands["c_only"]), 90)), opt(overlap(cands["neither"])), opt(rot(overlap(cands["edge"]), 270))],
    "In both examples the dot is inside the square AND inside the circle. Turning the figure does not matter.")
# 18 Hidden shape
TARGET = [(0, 10), (10, 10), (10, 0), (20, 0), (20, 10), (30, 10), (30, 20), (0, 20)]   # a step shape
EXTRA = [(12, 18, 70, 18), (24, 10, 24, 70), (40, 10, 70, 60), (12, 56, 68, 56), (56, 12, 56, 46)]
nvr("Hidden shapes", "Find the shape", "hidden shape",
    "In which option is the shape on the left hidden? It must be the same size and the same way round.",
    row_of([outline(place(TARGET, 25, 30), 2.5)]),
    opt(outline(place(TARGET, 30, 30)) + lines(EXTRA)),
    [opt(outline(place(turn_pts(TARGET, 2), 30, 30)) + lines(EXTRA)), opt(outline(place(turn_pts(TARGET, 1), 30, 22)) + lines(EXTRA)),
     opt(outline(place([(x * 0.7, y * 0.7) for x, y in TARGET], 34, 34)) + lines(EXTRA)),
     opt(outline(place(turn_pts(TARGET, 3), 30, 22)) + lines(EXTRA))],
    "The step shape must appear exactly as it is: the same size and with its bump at the top. The other options hide it upside down, on its side or smaller.")
# 19 Fold the left half over onto the right
PAT = (f'<rect x="12" y="14" width="12" height="12" fill="{INK}"/><circle cx="30" cy="52" r="6" fill="{GREY}" stroke="{INK}" stroke-width="1.5"/>'
       f'<polygon points="14,64 26,64 14,44" fill="{WHITE}" stroke="{INK}" stroke-width="1.5"/>')
PAT_NO_TRI = PAT[:PAT.index('<polygon')]
SHEET = f'<rect x="8" y="8" width="64" height="64" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
FOLD = f'<line x1="40" y1="4" x2="40" y2="76" stroke="{INK}" stroke-width="2" stroke-dasharray="5,4"/>'
def folded(pattern_right):
    half = f'<rect x="40" y="8" width="32" height="64" fill="{LIGHT}" stroke="{INK}" stroke-width="2"/>'
    return half + pattern_right
nvr("Folding", "Fold over", "paper folding",
    "The paper is see-through. It is folded along the dashed line so that the left half lies on top of the right half. What does it look like?",
    row_of([SHEET + FOLD + PAT]),
    opt(folded(tf(PAT, HFLIP))),
    [opt(folded(tf(PAT, "translate(40,0)"))), opt(folded(tf(tf(PAT, HFLIP), VFLIP))), opt(SHEET + FOLD + PAT + tf(PAT, HFLIP)), opt(folded(tf(PAT_NO_TRI, HFLIP)))],
    "Folding over a line works like a mirror: each mark lands the same distance from the fold on the other side, so the pattern appears reflected on the right half.")
# 20 Sides go up as lines go down: always 8 altogether
def sides_lines(kind, n):
    ls = [(40 + (i - (n - 1) / 2) * 8, 62, 40 + (i - (n - 1) / 2) * 8, 74) for i in range(n)]
    return shape(kind, cy=32, r=22) + lines(ls, 2.5)
kinds = ["triangle", "square", "pentagon", "hexagon", "heptagon"]
assert all(SIDES[k] + (5 - i) == 8 for i, k in enumerate(kinds))
nvr("Sequences", "Two rules", "sequence", SEQ_Q, frame_strip([sides_lines(k, 5 - i) for i, k in enumerate(kinds[:4])]),
    opt(sides_lines("heptagon", 1)), [opt(sides_lines("heptagon", 2)), opt(sides_lines("octagon", 1)), opt(sides_lines("hexagon", 1)), opt(sides_lines("heptagon", 0))],
    "Each time the shape gains a side and loses a line underneath, so sides + lines always make 8. Next: a 7-sided shape with 1 line.")


# 21-24: added when Non-Verbal became 3 parts of 8 (migration 058)
from nvr_extra import cube_opposite, symmetry, overlay, turning_arrow
add(**cube_opposite({(0, 0): "circle", (0, 1): "stripes", (1, 1): "dot", (1, 2): "black", (1, 3): "cross", (2, 3): "triangle"}, "dot"))
add(**symmetry({(1, 0), (0, 1), (1, 1), (0, 2), (1, 3)}))
_FA = f'<rect x="48" y="14" width="18" height="18" fill="none" stroke="{INK}" stroke-width="2.5"/>' + lines([(14, 66, 40, 40)])
_FB_dot = f'<circle cx="22" cy="24" r="6" fill="{INK}"/>'
_FB = _FB_dot + lines([(40, 66, 66, 66)])
add(**overlay(_FA, _FB, _FB_dot))
add(**turning_arrow(90, -60, [GREY, INK, WHITE],
    "The arrow turns 60° anticlockwise each time and the shading repeats grey, black, white. After four turns it has gone 240° anticlockwise, and the fifth shading is black."))

S.write(sys.argv[1], "mock-test-3-set-2",
        {"name": "Mock Test 3", "stage": "Challenger", "programmeCode": "GRAMMAR"}, 2,
        [{"subject": "ENGLISH", "sectionOrder": 1, "durationMinutes": 15},
         {"subject": "MATHS", "sectionOrder": 2, "durationMinutes": 15},
         {"subject": "VERBAL", "sectionOrder": 3, "durationMinutes": 10},
         {"subject": "NON_VERBAL", "sectionOrder": 4, "durationMinutes": 10}],
        TITLE, STORY, "Mock Test 3 · Set 2 · Challenger")
