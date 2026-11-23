"""Builds Mock Test 2, Set 1 (Challenger): original content only.

Mock Test 2 keeps English and Maths at Challenger level and makes Verbal and
Non-Verbal Reasoning harder than Mock Test 1: multi-step codes, deductions
with hidden information, two- and three-rule sequences, overlay matrices,
folding and punching, and cube nets. Nothing is reused from Mock Test 1.
Maths and Verbal answers are recomputed and asserted; Non-Verbal figures are
drawn from their rules.

Usage:  python -I docs/mock-tests/build_mock2_set1.py docs/mock-tests
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fractions import Fraction
from itertools import permutations
from mock_lib import (MockSet, INK, GREY, WHITE, LET, opt, shape, dots, arrow, tf, HFLIP, VFLIP,
                      frame_strip, analogy, matrix, code_stem, mirror_stem, BOX, SIDES)
from mock2_lib import (wheel, grid3, RING, small_arrow, segs, unfolded, paper, dashed, hole, fold_stem,
                       curl, net, cube_opposites, reflect_diag, rot, LIGHT)
from mock_lib import svg

S = MockSet(seed=20261122)
add = S.add

# =========================================================================
# ENGLISH - original story
# =========================================================================
TITLE = "The Swifts of Bellwether Lane"
STORY = """Every year, on or around the fifth of May, Mr Abara stood at the end of Bellwether Lane with a notebook and waited for the sky to change its mind.

Nadia had watched him do it since she was six. She had assumed, for most of those years, that he was simply a little odd. He was the sort of neighbour who wore a tie to put the bins out and who said "Good afternoon" as though he were reading it from a list of important announcements. But this spring she was eleven, and bored, and the end of the lane was as good a place as any to be bored in. So she went and stood beside him.

"What are we waiting for?" she asked.

"Swifts," said Mr Abara, without lowering his binoculars. "They've been in Africa all winter. They'll be here any day."

"How do you know they'll come back here? To this lane?"

"Because they always have." He paused. "Well. Fewer of them, every year. But always."

They waited for forty minutes and saw nothing but pigeons, which Mr Abara did not count. Nadia went home unimpressed.

The next evening, she went back.

On the third evening, just as the light was turning the colour of weak orange squash, there was a sound like someone tearing a sheet of paper very fast, high above the rooftops. Three dark shapes, shaped like anchors or like boomerangs, sliced across the sky and vanished behind the chimneys of number fourteen.

Mr Abara wrote something in his notebook. His hand, Nadia noticed, was not entirely steady.

"Is that it?" she said. "Three?"

"Three today," he said. "More tomorrow, if we're lucky." Then, more quietly: "Did you know that a young swift, once it leaves the nest, may not land again for two years? It eats in the air. It sleeps in the air. It only comes down when it is ready to build a nest of its own."

Nadia tried to imagine never touching the ground for two years. It made her feel slightly dizzy, as if the pavement had become less reliable.

"And they nest here?"

"Under the roof tiles of the old houses. There are gaps, you see, where the tiles meet the wall. Just big enough." He pointed with his pen at the long terrace opposite: number fourteen, number sixteen, number eighteen. "They have nested in those gaps for longer than anyone has lived in the houses."

It was a week later that the scaffolding went up around number sixteen.

Nadia saw the sign first: ROOF REPLACEMENT. Then she saw Mr Abara, standing very still on the pavement, reading it as though it were written in a language he had once known and since forgotten.

"New roof," he said, when she joined him. "New tiles. No gaps."

"Can't you tell them? The builders?"

"I'm a retired accountant, Nadia. I am not in the habit of telling people what to do with their roofs." He folded his notebook closed. "It is their house."

Nadia looked at the scaffolding, and at the dark gap under the old tiles, and at Mr Abara's tie, which was blue with small yellow birds on it. She had never noticed the birds before.

That night, she did something she had never done before: she read about swifts until her mother came in and turned off the light. She learned that they had lost more than half their numbers in Britain in the last few decades. She learned that this was partly because old buildings were being repaired, and new ones built without any gaps at all. And she learned that there were special bricks, hollow inside, which could be built into a wall to give a swift a place to nest.

The next morning she knocked on the door of number sixteen.

The woman who answered had paint on her hands and a baby on her hip. Nadia had prepared a speech. It began with "Excuse me" and contained the words "population decline" twice. By the end of it the woman was smiling, though Nadia could not tell whether that was a good sign or not.

"Swift bricks," the woman repeated. "I had no idea. Write it down for me, would you? I'll ask the builder."

Two weeks later, there was a new roof on number sixteen, as smooth and grey as a closed book. Mr Abara looked at it for a long time. Then Nadia took his arm, which she had never done before either, and walked him round to the side wall.

High up, just under the edge of the roof, there were three neat, dark slots in the brickwork.

Mr Abara said nothing at all. But that evening, at the end of Bellwether Lane, he handed Nadia the notebook and the pen.

"Your count," he said. "I'll hold the binoculars."

They counted eleven."""

E = "ENGLISH"
def eng(qtype, quest, answer, distractors, explanation):
    add(E, "Comprehension", None, qtype, quest, answer, distractors, explanation)

eng("retrieval", "Around which date did Mr Abara wait for the swifts each year?",
    "The fifth of May", ["The first of May", "The fifth of June", "The fifteenth of May", "The first of April"],
    "The first line says 'on or around the fifth of May'.")
eng("inference", "What did Nadia think of Mr Abara before this spring?",
    "She thought he was a little odd", ["She thought he was unkind", "She thought he was an expert on birds",
     "She had never noticed him", "She thought he was very funny"],
    "'She had assumed, for most of those years, that he was simply a little odd.'")
eng("language effects", "Mr Abara said \"Good afternoon\" \"as though he were reading it from a list of important announcements\". What does this suggest about him?",
    "He is very formal and serious in the way he speaks",
    ["He is shy and speaks very quietly", "He finds it hard to remember people's names",
     "He works as a newsreader", "He is rude to his neighbours"],
    "Reading 'important announcements' suggests a stiff, formal, serious manner, which fits his wearing a tie to put the bins out.")
eng("motivation", "Why did Nadia first go and stand beside Mr Abara?",
    "She was bored and had nothing better to do",
    ["She wanted to learn about swifts", "Her mother told her to keep him company",
     "She wanted to borrow his binoculars", "She was worried about him"],
    "'She was eleven, and bored, and the end of the lane was as good a place as any to be bored in.'")
eng("inference", "Why did Mr Abara not count the pigeons?",
    "He was only recording swifts", ["He could not see them clearly", "There were too many to count",
     "Nadia was counting them instead", "He did not like pigeons"],
    "He was waiting for swifts, so the pigeons did not belong in his record.")
eng("language effects", "The swifts made \"a sound like someone tearing a sheet of paper very fast\". What does this simile suggest?",
    "Their call was sharp, sudden and high-pitched",
    ["They were flying very low and slowly", "They were carrying paper to their nests",
     "Their call was soft and gentle", "They were frightened of Mr Abara"],
    "Tearing paper fast is a quick, harsh, ripping sound, like a swift's scream.")
eng("inference", "\"His hand, Nadia noticed, was not entirely steady.\" Why might Mr Abara's hand have been shaking?",
    "He was moved and relieved that the swifts had returned",
    ["He was cold because it was late in the evening", "He was angry that only three had come",
     "He was tired from holding the binoculars", "He was nervous about talking to Nadia"],
    "After years of falling numbers, seeing the swifts return clearly affects him deeply.")
eng("retrieval", "According to Mr Abara, how long might a young swift stay in the air without landing?",
    "Two years", ["Two weeks", "Two months", "Forty minutes", "One whole winter"],
    "'A young swift, once it leaves the nest, may not land again for two years.'")
eng("language effects", "Nadia felt \"as if the pavement had become less reliable\". What does this show?",
    "The idea of never landing was so strange that it unsettled her",
    ["The pavement on the lane was cracked and broken", "She was about to fall over",
     "She did not believe what Mr Abara said", "She wanted to fly like a swift"],
    "Imagining life without touching the ground makes her feel dizzy, so even solid ground seems less certain.")
eng("language effects", "Mr Abara read the sign \"as though it were written in a language he had once known and since forgotten\". What does this suggest?",
    "He was stunned and struggling to take in what it meant",
    ["He could not read English very well", "The sign was written in another language",
     "He had forgotten his glasses", "He was pleased about the new roof"],
    "He understands the words but is too shocked to accept what they mean for the swifts.")
eng("character", "Why does Mr Abara refuse to speak to the builders?",
    "He feels it is not his place to tell people what to do with their own homes",
    ["He is afraid of the builders", "He thinks the swifts will find somewhere else",
     "He does not care about the swifts any more", "He has already spoken to them"],
    "'I am not in the habit of telling people what to do with their roofs... It is their house.'")
eng("inference", "Nadia notices that Mr Abara's tie has small yellow birds on it. Why is this detail important?",
    "It shows how much birds really mean to him, which she had not realised before",
    ["It shows that he is wearing his best clothes", "It shows that he likes the colour yellow",
     "It explains why the builders ignored him", "It shows that Nadia wants a tie like it"],
    "She 'had never noticed the birds before': she is beginning to see him, and his love of birds, properly.")
eng("retrieval", "Which of these is NOT given as a reason for the fall in swift numbers?",
    "People feeding them the wrong food",
    ["Old buildings being repaired", "New buildings being built without gaps",
     "Fewer places for them to nest", "Gaps under roof tiles being closed"],
    "The passage blames repairs and new buildings that leave no gaps; feeding is never mentioned.")
eng("vocabulary", "Nadia's speech included the words \"population decline\". What do these words mean?",
    "A fall in the number of animals", ["A rise in the number of animals",
     "The movement of animals to another country", "A change in what animals eat", "A group of people who live together"],
    "A population is how many there are; a decline is a fall.")
eng("inference", "Why could Nadia not tell whether the woman's smile was \"a good sign or not\"?",
    "The woman might have been smiling because she was amused rather than convinced",
    ["The woman was smiling at her baby", "The woman had paint on her face",
     "Nadia could not see the woman clearly", "The woman did not speak English"],
    "A child giving a serious, rehearsed speech could make an adult smile kindly, so Nadia cannot be sure she has been taken seriously.")
eng("language effects", "The new roof was \"as smooth and grey as a closed book\". What does this suggest at first?",
    "That there seemed to be no openings left for the swifts",
    ["That the roof was badly built", "That the house was a library",
     "That the roof was easy to climb", "That the builders had painted it"],
    "A closed book has no gaps; the reader fears the swifts have been shut out, until the bricks are revealed.")
eng("character", "How has Nadia changed by the end of the story?",
    "She has gone from being bored by the swifts to taking action to protect them",
    ["She has become afraid of birds", "She has decided to become an accountant",
     "She has fallen out with Mr Abara", "She has stopped caring about the swifts"],
    "She begins 'unimpressed' but researches swifts, speaks to the neighbour and helps secure the swift bricks.")
eng("structure", "Why does Mr Abara hand Nadia the notebook and pen at the end?",
    "To show that he trusts her to carry on the work he cares about",
    ["Because his notebook was full", "Because he could no longer see the birds",
     "Because Nadia asked to borrow them", "Because he wanted to stop counting swifts"],
    "Handing over 'your count' passes on his yearly tradition to her.")

# =========================================================================
# MATHS
# =========================================================================
M = "MATHS"
assert 4235 - 1879 == 2356
add(M, "Number", "Subtraction", "calculation", "What is 4,235 − 1,879?",
    "2,356", ["2,456", "3,644", "2,366", "2,346"], "4,235 − 1,879 = 2,356. Check: 2,356 + 1,879 = 4,235.")
assert 1428 // 7 == 204 and 1428 % 7 == 0
add(M, "Number", "Division", "calculation", "What is 1,428 ÷ 7?",
    "204", ["24", "214", "240", "2,004"], "14 ÷ 7 = 2, 2 ÷ 7 = 0 r 2, 28 ÷ 7 = 4: 204.")
assert Fraction(5, 6) - Fraction(3, 8) == Fraction(11, 24)
add(M, "Fractions", "Subtracting fractions", "calculation", "What is 5/6 − 3/8?",
    "11/24", ["1/3", "1/12", "13/24", "8/14"], "20/24 − 9/24 = 11/24.")
assert Fraction(3, 5) * 85 == 51
add(M, "Fractions", "Fraction of an amount", "calculation", "What is 3/5 of 85?",
    "51", ["17", "34", "45", "55"], "85 ÷ 5 = 17; 17 × 3 = 51.")
assert 80 * Fraction(85, 100) == 68
add(M, "Percentages", "Percentage decrease", "word problem",
    "A coat costs £80. In a sale the price is reduced by 15%. What is the sale price?",
    "£68", ["£65", "£12", "£92", "£70"], "15% of £80 = £12; £80 − £12 = £68.")
assert 42 * Fraction(3, 7) == 18 and 42 - 18 == 24
add(M, "Ratio", "Sharing in a ratio", "word problem",
    "42 sweets are shared between Kit and Sam in the ratio 3 : 4. How many does Sam get?",
    "24", ["18", "28", "12", "21"], "There are 7 parts, so one part is 6. Sam gets 4 × 6 = 24.")
assert 3 * 6 - 4 * (6 - 7) == 22
add(M, "Algebra", "Substitution", "calculation", "If a = 6 and b = 7, what is 3a − 4(a − b)?",
    "22", ["14", "−22", "18", "10"], "3 × 6 = 18 and a − b = −1, so 4(a − b) = −4. 18 − (−4) = 22.")
assert [n * n + 1 for n in range(1, 6)] == [2, 5, 10, 17, 26] and 8 * 8 + 1 == 65
add(M, "Algebra", "Sequences", "pattern", "What is the 8th term of the sequence 2, 5, 10, 17, 26, …?",
    "65", ["50", "64", "37", "82"], "Each term is one more than a square number (1+1, 4+1, 9+1, …). The 8th is 8² + 1 = 65.")
vals = [12, 15, 9, 15, 11, 16, 13]; assert sum(vals) / 7 == 13 and max(vals) - min(vals) == 7
add(M, "Statistics", "Mean", "calculation", "What is the mean of 12, 15, 9, 15, 11, 16 and 13?",
    "13", ["15", "12", "14", "7"], "The total is 91 and there are 7 numbers: 91 ÷ 7 = 13.")
assert 180 - 2 * 38 == 104
add(M, "Shape", "Angles in an isosceles triangle", "reasoning",
    "An isosceles triangle has two equal angles of 38°. What is the third angle?",
    "104°", ["38°", "142°", "71°", "114°"], "Angles in a triangle add up to 180°: 180 − 38 − 38 = 104°.")
L = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 185" width="300" height="222">'
     '<polygon points="40,20 130,20 130,90 210,90 210,150 40,150" fill="#e0f2fe" stroke="#1f2937" stroke-width="2"/>'
     '<text x="85" y="14" font-size="11" text-anchor="middle" fill="#1f2937">9 cm</text>'
     '<text x="125" y="166" font-size="11" text-anchor="middle" fill="#1f2937">17 cm</text>'
     '<text x="20" y="88" font-size="11" text-anchor="middle" fill="#1f2937">13 cm</text>'
     '<text x="216" y="124" font-size="11" fill="#1f2937">6 cm</text>'
     '<text x="125" y="180" font-size="9" text-anchor="middle" fill="#6b7280">Not drawn to scale</text></svg>')
assert 9 * 13 + (17 - 9) * 6 == 165 and 2 * (17 + 13) == 60
add(M, "Shape", "Area of compound shapes", "diagram", "This shape is made of rectangles. What is its area? (All corners are right angles.)",
    "165 cm²", ["221 cm²", "117 cm²", "60 cm²", "153 cm²"],
    "Split it into a 9 × 13 rectangle (117 cm²) and an 8 × 6 rectangle (48 cm²): 117 + 48 = 165 cm².", stem=L)
assert 2 * (17 + 13) == 60
add(M, "Shape", "Perimeter", "diagram", "What is the perimeter of the same shape?",
    "60 cm", ["45 cm", "52 cm", "68 cm", "165 cm"],
    "For a shape with only right angles, the perimeter equals that of the surrounding 17 × 13 rectangle: 2 × (17 + 13) = 60 cm.", stem=L)
assert 2.5 * 1000 - 3 * 650 == 550
add(M, "Measures", "Capacity", "word problem",
    "A jug holds 2.5 litres of juice. Three glasses of 650 ml are poured out. How much juice is left?",
    "550 ml", ["1,850 ml", "650 ml", "450 ml", "1.95 l"], "2.5 l = 2,500 ml; 3 × 650 = 1,950 ml; 2,500 − 1,950 = 550 ml.")
assert (7 * 60 + 52) + 95 == 9 * 60 + 27
add(M, "Measures", "Time", "word problem", "A train leaves at 07:52 and the journey takes 95 minutes. When does it arrive?",
    "09:27", ["09:17", "08:47", "09:37", "08:27"], "95 minutes = 1 hour 35 minutes. 07:52 + 1 h = 08:52; + 35 min = 09:27.")
primes = [p for p in range(30, 50) if all(p % d for d in range(2, p))]; assert primes == [31, 37, 41, 43, 47]
add(M, "Number", "Prime numbers", "reasoning", "How many prime numbers are there between 30 and 50?",
    "5", ["4", "6", "3", "7"], "31, 37, 41, 43 and 47.")
lcm = 12; assert all(lcm % k == 0 for k in (4, 6)) and not any(m % 4 == 0 and m % 6 == 0 for m in range(1, 12))
add(M, "Number", "Multiples", "word problem",
    "One bell rings every 4 minutes and another rings every 6 minutes. They both ring at 10:00. When will they next ring together?",
    "10:12", ["10:24", "10:10", "10:06", "10:02"], "The lowest common multiple of 4 and 6 is 12, so they next ring together 12 minutes later.")
add(M, "Shape", "Coordinates", "reasoning",
    "The point (3, −2) is reflected in the x-axis. Where does it end up?",
    "(3, 2)", ["(−3, −2)", "(−3, 2)", "(2, 3)", "(−2, 3)"],
    "Reflecting in the x-axis keeps the x-coordinate and changes the sign of the y-coordinate.")
red, blue, green = 4, 7, 9; assert Fraction(blue, red + blue + green) == Fraction(7, 20)
add(M, "Statistics", "Probability", "reasoning",
    "A bag holds 4 red, 7 blue and 9 green counters. One is taken at random. What is the probability that it is blue?",
    "7/20", ["7/13", "1/3", "7/16", "13/20"], "There are 20 counters and 7 are blue, so the probability is 7/20.")
x = 13; assert 4 * x - 7 == 45
add(M, "Algebra", "Forming equations", "multi-step",
    "I think of a number, multiply it by 4 and subtract 7. The answer is 45. What was my number?",
    "13", ["11", "52", "10", "12"], "Work backwards: 45 + 7 = 52, then 52 ÷ 4 = 13.")
assert 6 * 345 + 2 * 180 == 2430 and 5000 - 2430 == 2570
add(M, "Number", "Money", "multi-step",
    "Ruby buys 6 notebooks at £3.45 each and 2 pens at £1.80 each. She pays with a £50 note. How much change does she get?",
    "£25.70", ["£24.30", "£26.70", "£29.30", "£23.60"],
    "6 × £3.45 = £20.70 and 2 × £1.80 = £3.60; total £24.30. £50 − £24.30 = £25.70.")
assert len([q for q in S.questions if q["subject"] == M]) == 20

# =========================================================================
# VERBAL REASONING - harder than Mock Test 1
# =========================================================================
V = "VERBAL"
A = ord("A")
def shift_each(word, steps):
    return "".join(chr((ord(c) - A + k) % 26 + A) for c, k in zip(word, steps))

# 1 Position-dependent shift: +1, +2, +3, ...
assert shift_each("CAT", [1, 2, 3]) == "DCW"
ans = shift_each("LAMP", [1, 2, 3, 4]); assert ans == "MCPT"
add(V, "Codes", "Growing shift", "letter code",
    "In a code, CAT is written as DCW. How would LAMP be written in the same code?",
    ans, [shift_each("LAMP", [1, 1, 1, 1]), shift_each("LAMP", [1, 2, 3, 3]), shift_each("LAMP", [3, 2, 1, 0]), "NCPT"],
    "The 1st letter moves on 1, the 2nd moves on 2, the 3rd moves on 3, and so on: L→M, A→C, M→P, P→T.")
# 2 Decode with the shift going backwards
enc = shift_each("SWAN", [2] * 4); assert enc == "UYCP"
add(V, "Codes", "Decoding", "letter code",
    "In a code, FROG is written as HTQI. Using the same code, what does UYCP stand for?",
    "SWAN", ["SCAN", "SPAN", "SWAT", "WAVE"],
    "Each letter moves on 2 to make the code, so move each code letter back 2: U→S, Y→W, C→A, P→N.")
# 3 Letter pairs moving in opposite directions with growing gaps
first = "A"; second = "Z"; seq = []
for g in (0, 2, 3, 4, 5):
    first = chr(ord(first) + g); second = chr(ord(second) - g); seq.append(first + second)
assert seq == ["AZ", "CX", "FU", "JQ", "OL"]
add(V, "Series", "Letter pairs", "letter series", "Find the next pair of letters: AZ, CX, FU, JQ, ?",
    "OL", ["OM", "NL", "PL", "OK"],
    "The first letters go forward 2, 3, 4, 5 (A, C, F, J, O). The second letters go back 2, 3, 4, 5 (Z, X, U, Q, L).")
# 4 Two interleaved doubling series
s = [3, 4, 6, 8, 12, 16, 24]; assert s[0::2] == [3, 6, 12, 24] and s[1::2] == [4, 8, 16]
add(V, "Series", "Two series", "number series", "Find the next number: 3, 4, 6, 8, 12, 16, 24, ?",
    "32", ["28", "30", "36", "48"], "Two series take turns, and each doubles: 3, 6, 12, 24 and 4, 8, 16, 32.")
# 5 Double and add one
s = [2]; [s.append(s[-1] * 2 + 1) for _ in range(5)]; assert s == [2, 5, 11, 23, 47, 95]
add(V, "Series", "Number series", "number series", "Find the next number: 2, 5, 11, 23, 47, ?",
    "95", ["94", "71", "93", "96"], "Each number is doubled and then 1 is added: 47 × 2 + 1 = 95.")
# 6 Numbers in brackets: 2a + b
assert 2 * 8 + 3 == 19 and 2 * 7 + 3 == 17 and 2 * 9 + 4 == 22
add(V, "Number", "Related numbers", "missing number",
    "The numbers in each group are related in the same way. Find the missing number.\n8 (19) 3     7 (17) 3     9 ( ? ) 4",
    "22", ["13", "36", "21", "23"], "Double the first number and add the second: 8 × 2 + 3 = 19, 7 × 2 + 3 = 17, 9 × 2 + 4 = 22.")
# 7 Three-letter word missing from a capital word
assert "S" + "CAR" + "F" == "SCARF"
add(V, "Word building", "Missing three letters", "missing word",
    "Three letters that make a word have been taken out of the word in capitals. Which three letters complete it?\nIn winter she wore a thick, woolly SF around her neck.",
    "CAR", ["ORE", "PIT", "ARK", "TOP"], "S + CAR + F = SCARF.")
# 8 Word pairs: remove the second letter
rule = lambda w: w[0] + w[2:]
assert rule("pain") == "pin" and rule("fear") == "far" and rule("beat") == "bat"
add(V, "Word building", "Word pairs", "word pattern",
    "Find the word that completes the third pair in the same way as the first two.\n(pain, pin)   (fear, far)   (beat, ?)",
    "bat", ["bet", "eat", "bit", "bea"], "The second letter is removed each time: pain → pin, fear → far, beat → bat.")
# 9 Synonyms across two groups
add(V, "Vocabulary", "Synonyms", "synonym",
    "Choose one word from each group that are closest in meaning.\n(brave, happy, tired)   (weary, angry, cowardly)",
    "tired, weary", ["brave, cowardly", "happy, angry", "brave, weary", "happy, weary"],
    "Tired and weary both mean in need of rest. Brave and cowardly are opposites.")
# 10 Antonyms across two groups (a synonym pair is the trap)
add(V, "Vocabulary", "Antonyms", "antonym",
    "Choose one word from each group that are most nearly OPPOSITE in meaning.\n(scarce, noisy, heavy)   (loud, plentiful, weighty)",
    "scarce, plentiful", ["noisy, loud", "heavy, weighty", "heavy, plentiful", "noisy, weighty"],
    "Scarce means in short supply; plentiful means there is a lot. Noisy/loud and heavy/weighty mean the same.")
# 11 Odd two out
add(V, "Vocabulary", "Odd two out", "classification",
    "Three of these words go together. Which TWO do not belong?\ncod   salmon   whale   trout   dolphin",
    "whale, dolphin", ["cod, trout", "salmon, whale", "trout, dolphin", "cod, salmon"],
    "Cod, salmon and trout are fish. Whales and dolphins are mammals.")
# 12 Hidden five-letter word across two words
def hides(pair, word):
    a, b = pair.lower().split()
    j = a + b
    return any(j[i:i + len(word)] == word and i < len(a) < i + len(word) for i in range(len(j)))
assert hides("this tone", "stone")
add(V, "Hidden words", "Across two words", "hidden word",
    "A five-letter word is hidden across the end of one word and the start of the next. Which pair hides it?\n\"Do you like this tone of voice?\"",
    "this tone", ["Do you", "you like", "like this", "tone of"], "thi(S TONE) hides STONE.")
# 13 Letter analogy
an = lambda p, k: "".join(chr(ord(c) + k) for c in p)
assert an("AC", 5) == "FH" and an("LN", 5) == "QS"
add(V, "Alphabet", "Letter analogies", "letter analogy", "AC is to FH as LN is to ?",
    "QS", ["PR", "QR", "RS", "OQ"], "Each letter moves forward 5 places: A→F, C→H, so L→Q and N→S.")
# 14 Days of the week
days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
today = (days.index("Saturday") - 2) % 7; ans = days[(today - 2) % 7]; assert ans == "Tuesday"
add(V, "Logic", "Days", "logic",
    "If the day after tomorrow is Saturday, what day was it the day before yesterday?",
    ans, ["Wednesday", "Monday", "Thursday", "Sunday"], "Today is Thursday (two days before Saturday), so the day before yesterday was Tuesday.")
# 15 Race order: brute force
kids = ["Ali", "Ben", "Cara", "Dev", "Ella"]
orders = [o for o in permutations(kids)
          if o[-1] == "Ella" and o.index("Dev") < o.index("Ben") < o.index("Cara") and o.index("Ali") == o.index("Cara") - 1]
assert len(orders) == 1 and orders[0][2] == "Ali"
add(V, "Logic", "Ordering", "logic",
    "Five children ran a race. Ella finished last. Ben finished after Dev but before Cara. Ali finished immediately before Cara. Who came third?",
    "Ali", ["Ben", "Cara", "Dev", "Ella"], "The only order that fits is Dev, Ben, Ali, Cara, Ella, so Ali came third.")
# 16 Letters stand for numbers
val = {"A": 3, "B": 5, "C": 10, "D": 15, "E": 25}
r = val["A"] * val["B"] + val["C"]; assert [k for k, v in val.items() if v == r] == ["E"]
S.letters_question("Number", "Letters for numbers", "letter sum",
    "If A = 3, B = 5, C = 10, D = 15 and E = 25, what is (A × B) + C? Give your answer as a letter.",
    "E", "A × B = 15; 15 + C = 15 + 10 = 25, which is E.")
# 17 Number codes, not in order: brute force that the answer is certain
words = ["TEAM", "MEAT", "MATE"]
codes = ["2716", "6127"]
answers = set()
for chosen in permutations(words, 2):
    m = {}
    if all(m.setdefault(ch, d) == d for w, c in zip(chosen, codes) for ch, d in zip(w, c)) and len(set(m.values())) == len(m):
        answers.add("".join(m.get(ch, "?") for ch in "TAME"))
assert answers == {"2167"}, answers
add(V, "Codes", "Number codes", "number code",
    "Here are three words and the codes for two of them, in no particular order.\nTEAM   MEAT   MATE        2716   6127\nWhat is the code for TAME?",
    "2167", ["2617", "2176", "6172", "1267"],
    "MEAT and TEAM both have E then A in the middle, but the two codes do not share middle digits, so the codes must belong to one of them and MATE. Only TEAM = 2716 and MATE = 6127 agree: T = 2, E = 7, A = 1, M = 6. So TAME = 2167.")
# 18 Two words swap places
add(V, "Sentences", "Swap two words", "word order",
    "Two words must swap places for the sentence to make sense. Which two?\nThe oven took the cake out of the baker.",
    "oven, baker", ["cake, oven", "took, out", "cake, baker", "took, baker"],
    "The baker took the cake out of the oven.")
# 19 One word for two pairs
add(V, "Vocabulary", "Double meanings", "multiple meaning",
    "Which word goes equally well with both pairs of words?\n(look, observe)   (clock, timer)",
    "watch", ["view", "alarm", "stare", "hour"], "You watch (look at) something, and a watch tells the time.")
# 20 Two-letter series moving at different speeds
f = [chr(ord("C") + 3 * i) for i in range(5)]; s2 = [chr(ord("E") + 4 * i) for i in range(5)]
seq = [a + b for a, b in zip(f, s2)]; assert seq == ["CE", "FI", "IM", "LQ", "OU"]
add(V, "Series", "Letter pairs", "letter series", "Find the next pair of letters: CE, FI, IM, LQ, ?",
    "OU", ["OV", "NU", "PU", "OT"], "The first letters go forward 3 each time (C, F, I, L, O); the second go forward 4 (E, I, M, Q, U).")

# =========================================================================
# NON-VERBAL REASONING - harder than Mock Test 1
# =========================================================================
N = "NON_VERBAL"
def nvr(topic, sub, qtype, quest, stem, answer, distractors, explanation, option_format="svg"):
    add(N, topic, sub, qtype, quest, answer, distractors, explanation, stem=stem, option_format=option_format)

SEQ_Q = "Which figure comes next in the sequence?"
ODD_Q = "Which figure is the odd one out?"
AN_Q = "The first figure changes into the second. Which option changes in the same way from the third figure?"

# 1 Wheel: black sector moves 1 clockwise, grey sector moves 2 anticlockwise
def bw(b, g):
    assert b != g
    return wheel([INK if i == b else GREY if i == g else WHITE for i in range(8)])
frames = [(k % 8, (5 - 2 * k) % 8) for k in range(5)]
assert frames[4] == (4, 5)
nvr("Sequences", "Two moving parts", "sequence", SEQ_Q,
    frame_strip([bw(*f) for f in frames[:4]]),
    opt(bw(*frames[4])), [opt(bw(4, 3)), opt(bw(4, 7)), opt(bw(5, 4)), opt(bw(3, 5))],
    "The black part moves one place clockwise each time. The grey part moves two places anticlockwise. Next the black part is at the bottom and the grey part is just to its left.")
# 2 Sides +1, dots +2, shading alternates
kinds = ["triangle", "square", "pentagon", "hexagon", "heptagon"]
def sdot(kind, n, fill):
    return shape(kind, fill=fill, r=30) + dots(n, r=2.6, gap=7.5, cols=3)
seq = [sdot(kinds[i], 2 * i + 1, WHITE if i % 2 == 0 else LIGHT) for i in range(5)]
nvr("Sequences", "Three rules", "sequence", SEQ_Q, frame_strip(seq[:4]),
    opt(seq[4]), [opt(sdot("heptagon", 9, LIGHT)), opt(sdot("heptagon", 8, WHITE)), opt(sdot("hexagon", 9, WHITE)),
                  opt(sdot("octagon", 9, WHITE))],
    "Each shape has one more side, two more dots, and the shading alternates white, grey. Next: a white 7-sided shape with 9 dots.")
# 3 Grid: black square 1 step clockwise, grey circle 2 steps anticlockwise
pos = [(RING[k % 8], RING[(5 - 2 * k) % 8]) for k in range(5)]
assert all(b != c for b, c in pos)
g3 = lambda b, c: grid3(black=(b,), circles=(c,))
nvr("Sequences", "Two moving parts", "sequence", SEQ_Q, frame_strip([g3(*p) for p in pos[:4]]),
    opt(g3(*pos[4])), [opt(g3(RING[4], RING[3])), opt(g3(RING[5], RING[5])), opt(g3(RING[3], RING[5])), opt(g3(RING[4], RING[7]))],
    "The black square moves one place clockwise around the edge; the grey circle moves two places anticlockwise.")
# 4 Odd one out: four rotations, one reflection
FLAG = (f'<polygon points="22,66 22,14 58,14 46,26 58,38 30,38 30,66" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
        f'<circle cx="38" cy="26" r="4" fill="{INK}"/>')
nvr("Odd one out", "Rotation or reflection", "odd one out", ODD_Q, None,
    opt(rot(tf(FLAG, HFLIP), 90)), [opt(rot(FLAG, a)) for a in (0, 90, 180, 270)],
    "Four figures are the same shape turned to different angles. The odd one out is a mirror image, which no amount of turning can produce.")
# 5 Odd one out: the arrow points at the black circle
def aim(a, white_a, toward_black=True):
    import math
    bx, by = 40 + 27 * math.sin(math.radians(a)), 40 - 27 * math.cos(math.radians(a))
    wx, wy = 40 + 27 * math.sin(math.radians(white_a)), 40 - 27 * math.cos(math.radians(white_a))
    if not toward_black:
        bx, by, wx, wy = wx, wy, bx, by
    return (small_arrow(40, 40, a, s=0.6) + f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="7" fill="{INK}"/>'
            f'<circle cx="{wx:.1f}" cy="{wy:.1f}" r="7" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>')
nvr("Odd one out", "Direction", "odd one out", ODD_Q, None,
    opt(aim(135, 270, toward_black=False)),
    [opt(aim(0, 135)), opt(aim(90, 225)), opt(aim(225, 0)), opt(aim(315, 90))],
    "In four figures the arrow points at the black circle. In the odd one out it points at the white circle.")
# 6 Odd one out: sides of the two shapes add to 9
def nest(outer, inner):
    return shape(outer, fill=WHITE, r=32) + shape(inner, fill=GREY, r=13)
good = [("hexagon", "triangle"), ("pentagon", "square"), ("square", "pentagon"), ("triangle", "hexagon")]
assert all(SIDES[a] + SIDES[b] == 9 for a, b in good) and SIDES["pentagon"] + SIDES["triangle"] == 8
nvr("Odd one out", "Counting sides", "odd one out", ODD_Q, None,
    opt(nest("pentagon", "triangle")), [opt(nest(a, b)) for a, b in good],
    "In four figures the two shapes have 9 sides altogether (6 + 3, 5 + 4, 4 + 5, 3 + 6). The odd one out has 5 + 3 = 8.")
# 7 Analogy: turn 90° clockwise AND swap black and white
def tag(big, small):
    return (f'<polygon points="16,24 52,24 64,40 52,56 16,56" fill="{big}" stroke="{INK}" stroke-width="2"/>'
            f'<circle cx="28" cy="40" r="6" fill="{small}" stroke="{INK}" stroke-width="2"/>')
def boat(hull, sail):
    return (f'<polygon points="14,52 66,52 56,64 24,64" fill="{hull}" stroke="{INK}" stroke-width="2"/>'
            f'<polygon points="40,14 40,48 62,48" fill="{sail}" stroke="{INK}" stroke-width="2"/>'
            f'<line x1="40" y1="14" x2="40" y2="52" stroke="{INK}" stroke-width="2"/>')
nvr("Analogies", "Two changes", "analogy", AN_Q,
    analogy(tag(WHITE, INK), rot(tag(INK, WHITE), 90), boat(INK, WHITE)),
    opt(rot(boat(WHITE, INK), 90)),
    [opt(rot(boat(INK, WHITE), 90)), opt(boat(WHITE, INK)), opt(rot(boat(WHITE, INK), -90)), opt(tf(boat(WHITE, INK), HFLIP))],
    "Two things happen: the figure turns 90° clockwise, and black and white swap. Both must be applied to the boat.")
# 8 Analogy: inner and outer shapes swap
def io(outer, inner):
    return shape(outer, fill=GREY, r=32) + shape(inner, fill=WHITE, r=13)
nvr("Analogies", "Swapping", "analogy", AN_Q,
    analogy(io("square", "circle"), io("circle", "square"), io("triangle", "pentagon")),
    opt(io("pentagon", "triangle")),
    [opt(shape("pentagon", fill=WHITE, r=32) + shape("triangle", fill=GREY, r=13)), opt(io("triangle", "pentagon")),
     opt(io("pentagon", "square")), opt(io("hexagon", "triangle"))],
    "The outer and inner shapes swap places, but the outer one is always grey and the inner one white.")
# 9 Analogy: number of sides becomes number of dots
def cdots(n):
    return shape("circle", r=30) + dots(n, r=3, gap=10, cols=3)
nvr("Analogies", "Counting", "analogy", AN_Q,
    analogy(shape("pentagon", r=30), cdots(5), shape("hexagon", r=30)),
    opt(cdots(6)), [opt(cdots(5)), opt(shape("hexagon", r=30) + dots(6, r=3, gap=10, cols=3)), opt(cdots(7)), opt(shape("square", r=30) + dots(6, r=3, gap=10, cols=3))],
    "The shape becomes a circle with one dot for each side it had: 5 sides → 5 dots, so 6 sides → 6 dots.")
# 10 Matrix 3 x 3: the third cell keeps the lines that appear in only one of the first two
rows = [({"V", "D1"}, {"V", "H"}), ({"T", "O"}, {"O", "D2"}), ({"H", "D1", "D2"}, {"D1", "V"})]
cells = []
for a, b in rows:
    cells += [segs(a), segs(b), segs(a ^ b)]
last = rows[2][0] ^ rows[2][1]
assert last == {"H", "D2", "V"}
nvr("Matrices", "Overlay", "matrix", "Which option completes the grid?", matrix(cells[:-1], 3),
    opt(segs(last)),
    [opt(segs(rows[2][0] | rows[2][1])), opt(segs(rows[2][0] & rows[2][1])), opt(segs({"H", "D2"})), opt(segs({"H", "D2", "V", "O"}))],
    "In each row the first two figures are put on top of each other, and any line that appears in BOTH disappears. Lines that appear in only one stay.")
# 11 Matrix 3 x 3: rows set the number of arrows, columns turn them 90° clockwise
def arrs(n, a):
    xs = {1: [40], 2: [28, 52], 3: [20, 40, 60]}[n]
    return "".join(small_arrow(x, 40, a, s=0.4) for x in xs)
cells = [arrs(r + 1, 45 * r + 90 * c) for r in range(3) for c in range(3)]
nvr("Matrices", "Rows and columns", "matrix", "Which option completes the grid?", matrix(cells[:-1], 3),
    opt(arrs(3, 270)), [opt(arrs(3, 90)), opt(arrs(2, 270)), opt(arrs(3, 225)), opt(arrs(3, 180))],
    "Each row has 1, 2 or 3 arrows, and across each row they turn 90° clockwise. The bottom row starts pointing right, so it ends pointing left.")
# 12 Reflection in a diagonal mirror line
P = (f'<polygon points="14,14 50,14 50,26 26,26 26,44 14,44" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
     f'<circle cx="56" cy="44" r="6" fill="{INK}"/><rect x="34" y="54" width="10" height="10" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>')
diag_stem = svg(f'<g transform="translate(5,5)">{P}<line x1="0" y1="0" x2="80" y2="80" stroke="{INK}" '
                f'stroke-width="2" stroke-dasharray="5,4"/></g>', 90, 90)
nvr("Reflection", "Diagonal mirror", "reflection", "Which option shows the figure reflected in the dashed diagonal mirror line?",
    diag_stem, opt(reflect_diag(P)),
    [opt(rot(P, 90)), opt(tf(P, HFLIP)), opt(tf(P, VFLIP)), opt(rot(P, 270))],
    "In a diagonal mirror, each point's distance across and distance down swap over. The bar along the top moves down the left side, the circle moves below the centre and the small square moves to the right side.")
# 13 Reflect then rotate
K = (f'<polygon points="18,62 18,18 34,18 34,36 54,18 62,26 44,42 62,62 50,62 34,48 34,62" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
     f'<circle cx="62" cy="64" r="5" fill="{INK}"/>')
nvr("Rotation", "Two steps", "rotation",
    "The figure is reflected in a vertical mirror line and then turned 90° clockwise. Which option shows the result?",
    frame_strip([K], question=False),
    opt(rot(tf(K, HFLIP), 90)),
    [opt(rot(K, 90)), opt(tf(K, VFLIP)), opt(rot(tf(K, HFLIP), -90)), opt(tf(K, HFLIP))],
    "First reflect it so the arms point left, then turn the result a quarter turn clockwise. Doing the steps in the other order gives a different answer.")
# 14 Rotation with reflections as traps
Z = (f'<polygon points="14,20 46,20 46,34 30,34 30,46 64,46 64,60 16,60 16,34 14,34" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
     f'<rect x="52" y="16" width="10" height="10" fill="{INK}"/>')
nvr("Rotation", "Quarter turn", "rotation", "Which option shows the figure turned 90° clockwise?",
    frame_strip([Z], question=False),
    opt(rot(Z, 90)), [opt(tf(rot(Z, 90), HFLIP)), opt(tf(rot(Z, 90), VFLIP)), opt(rot(Z, 270)), opt(rot(Z, 180))],
    "A quarter turn clockwise moves the black square from top-right to bottom-right. Two options are mirror images of the correct answer.")
# 15 Fold twice, punch, unfold
holes_q = [(20, 20), (32, 33)]
def unfold(hs):
    out = set()
    for x, y in hs:
        for X in (x, 80 - x):
            for Y in (y, 80 - y):
                out.add((X, Y))
    return sorted(out)
answer_holes = unfold(holes_q)
assert len(answer_holes) == 8
steps = [paper(10, 10, 60, 60) + dashed(40, 6, 40, 74) + curl(62, 30, 22, 30),
         paper(10, 10, 30, 60) + dashed(6, 40, 44, 40) + curl(25, 62, 25, 22),
         paper(10, 10, 30, 30) + "".join(hole(x, y) for x, y in holes_q)]
wrong1 = sorted({(x, y) for x, y in holes_q} | {(80 - x, y) for x, y in holes_q})
wrong2 = sorted({(X, Y) for x, y in [(20, 20), (32, 33)] for X, Y in [(x, y), (80 - x, 80 - y), (80 - y, x), (y, 80 - x)]})
wrong3 = sorted({(x, y) for x, y in answer_holes if not (x == 48 and y == 47)})
wrong4 = sorted({(X, Y) for x, y in [(20, 20), (28, 28)] for X in (x, 80 - x) for Y in (y, 80 - y)})
assert len({tuple(answer_holes), tuple(wrong1), tuple(wrong2), tuple(wrong3), tuple(wrong4)}) == 5
nvr("Folding", "Fold and punch", "paper folding",
    "A square of paper is folded in half from right to left, then from bottom to top. Two holes are punched through it. What does the paper look like when it is unfolded?",
    fold_stem(steps), opt(unfolded(answer_holes)),
    [opt(unfolded(wrong1)), opt(unfolded(wrong2)), opt(unfolded(wrong3)), opt(unfolded(wrong4))],
    "Each hole goes through four layers, so there are 8 holes. Each unfold reflects the holes in the fold line, so the pattern is mirrored left to right and top to bottom.")
# 16 Codes: three letters (shape, shading, number of lines)
SH = {"circle": "P", "square": "Q", "triangle": "R"}
FL = {WHITE: "F", INK: "G"}
LN = {1: "X", 2: "Y"}
def coded(kind, fill, lines):
    bars = "".join(f'<line x1="{30 + 20 * i if lines == 2 else 40}" y1="64" x2="{30 + 20 * i if lines == 2 else 40}" y2="76" '
                   f'stroke="{INK}" stroke-width="3"/>' for i in range(lines))
    return shape(kind, fill=fill, cy=34, r=22) + bars
ex = [("circle", WHITE, 1), ("square", INK, 1), ("triangle", WHITE, 2), ("circle", INK, 2)]
nvr("Codes", "Three-letter codes", "code",
    "Each figure has a three-letter code. Work out what each letter stands for. What is the code for the last figure?",
    code_stem([(coded(k, f, n), SH[k] + FL[f] + LN[n]) for k, f, n in ex], coded("square", WHITE, 2)),
    SH["square"] + FL[WHITE] + LN[2], ["QGY", "QFX", "PFY", "RFY"],
    "The first letter is the shape (P circle, Q square, R triangle), the second is the shading (F white, G black) and the third is the number of lines below it (X one, Y two). So QFY.",
    option_format="text")
# 17 Codes: one feature is a distraction
OUT = {"circle": "J", "square": "K", "hexagon": "L"}
DOTN = {1: "U", 2: "V", 3: "W"}
def code2(kind, n, fill):
    return shape(kind, fill=fill, r=28) + dots(n, r=4, gap=12, fill=INK if fill != INK else WHITE)
ex = [("circle", 2, GREY), ("square", 1, WHITE), ("hexagon", 3, GREY), ("square", 3, WHITE), ("circle", 1, WHITE)]
nvr("Codes", "Spot what matters", "code",
    "Each figure has a code. Not every feature is part of the code. What is the code for the last figure?",
    code_stem([(code2(k, n, f), OUT[k] + DOTN[n]) for k, n, f in ex], code2("hexagon", 2, WHITE)),
    OUT["hexagon"] + DOTN[2], ["LW", "KV", "VL", "JV"],
    "The first letter is the shape (J circle, K square, L hexagon) and the second is the number of dots (U one, V two, W three). The shading is not part of the code. So LV.",
    option_format="text")
# 18 Similarity: inner shape has one side fewer than the outer shape
def sim(outer, inner, fill=GREY):
    return shape(outer, fill=WHITE, r=32) + shape(inner, fill=fill, r=14)
assert SIDES["square"] - SIDES["triangle"] == 1 and SIDES["hexagon"] - SIDES["pentagon"] == 1
ex_stem = svg("".join(f'<g transform="translate({5 + i * 90},5)">{BOX}{f}</g>'
                      for i, f in enumerate([sim("square", "triangle"), sim("hexagon", "pentagon", INK)])), 180, 90)
nvr("Similarities", "Find the rule", "similarity", "Which option is most like the two figures on the left?",
    ex_stem, opt(sim("pentagon", "square", WHITE)),
    [opt(sim("pentagon", "triangle")), opt(sim("square", "square")), opt(sim("triangle", "square")), opt(sim("hexagon", "square", INK))],
    "In each figure the inner shape has exactly one side fewer than the outer shape (4 and 3, 6 and 5). Only the pentagon with a square inside does this. Shading does not matter.")
# 19 Two independent rules: small square round the corners, line turns 45°
CORN = [(22, 22), (58, 22), (58, 58), (22, 58)]
def sqline(k):
    x, y = CORN[k % 4]
    return (shape("square", r=40) + f'<rect x="{x - 6}" y="{y - 6}" width="12" height="12" fill="{INK}"/>'
            + f'<g transform="rotate({45 * k} 40 40)"><line x1="40" y1="26" x2="40" y2="54" stroke="{INK}" stroke-width="3"/>'
              f'<circle cx="40" cy="26" r="3.5" fill="{INK}"/></g>')
def sqline_x(corner, a):
    x, y = CORN[corner]
    return (shape("square", r=40) + f'<rect x="{x - 6}" y="{y - 6}" width="12" height="12" fill="{INK}"/>'
            + f'<g transform="rotate({a} 40 40)"><line x1="40" y1="26" x2="40" y2="54" stroke="{INK}" stroke-width="3"/>'
              f'<circle cx="40" cy="26" r="3.5" fill="{INK}"/></g>')
nvr("Sequences", "Two rules", "sequence", SEQ_Q, frame_strip([sqline(k) for k in range(4)]),
    opt(sqline(4)), [opt(sqline_x(0, 0)), opt(sqline_x(1, 180)), opt(sqline_x(3, 0)), opt(sqline_x(0, 45))],
    "The black square moves one corner clockwise each time and the line with the dot turns 45° clockwise. Next the square is back at the top-left and the line has turned 180°, so its dot is now at the bottom.")
# 20 Cube net: which face is opposite?
cells = {(0, 1): "circle", (1, 0): "cross", (1, 1): "black", (1, 2): "dot", (2, 1): "triangle", (3, 1): "stripes"}
opp = cube_opposites(cells)
assert opp["black"] == "stripes" and opp["circle"] == "triangle" and opp["cross"] == "dot"
NAMES = {"circle": "The circle", "cross": "The cross", "dot": "The dot", "triangle": "The triangle", "stripes": "The stripes"}
nvr("Cubes", "Nets", "cube net", "This net is folded to make a cube. Which face is opposite the black face?",
    net(cells), NAMES[opp["black"]], [NAMES[k] for k in ("circle", "cross", "dot", "triangle")],
    "In a straight line of four faces, faces that are one apart are opposite: black (2nd) is opposite stripes (4th). The circle and triangle touch the black face, so they cannot be opposite it.",
    option_format="text")


# 21-24: added when Non-Verbal became 3 parts of 8 (migration 058)
from nvr_extra import cube_view, hidden, missing_middle, overlay
from mock2_lib import wheel as _wheel
from mock3_lib import lines
add(**cube_view({(0, 1): "circle", (1, 0): "grey", (1, 1): "black", (1, 2): "dot", (1, 3): "cross", (2, 2): "diamond"}, pick=1))
add(**hidden([(0, 0), (10, 0), (10, 20), (26, 20), (26, 30), (0, 30)],
             [(10, 16, 70, 16), (46, 10, 46, 70), (14, 40, 66, 40), (18, 70, 66, 26), (30, 64, 70, 64)]))
_sect = lambda n, start=0, f=INK: _wheel([f if (i - start) % 8 < n else WHITE for i in range(8)])
add(**missing_middle([_sect(k + 1) for k in range(5)], [_sect(2), _sect(4), _sect(3, 2), _sect(3, 0, GREY)],
    "One more part is shaded black each time, always starting from the top and going clockwise. The middle figure has 3 black parts."))
_FA = lines([(14, 40, 66, 40)]) + f'<polygon points="14,14 32,14 14,32" fill="{INK}"/>'
_FB_ring = f'<circle cx="56" cy="58" r="8" fill="none" stroke="{INK}" stroke-width="2.5"/>'
_FB = _FB_ring + lines([(26, 14, 26, 66)])
add(**overlay(_FA, _FB, _FB_ring))

S.write(sys.argv[1], "mock-test-2-set-1",
        {"name": "Mock Test 2", "stage": "Challenger", "programmeCode": "GRAMMAR"}, 1,
        [{"subject": "ENGLISH", "sectionOrder": 1, "durationMinutes": 15},
         {"subject": "MATHS", "sectionOrder": 2, "durationMinutes": 15},
         {"subject": "VERBAL", "sectionOrder": 3, "durationMinutes": 10},
         {"subject": "NON_VERBAL", "sectionOrder": 4, "durationMinutes": 10}],
        TITLE, STORY, "Mock Test 2 · Set 1 · Challenger")
