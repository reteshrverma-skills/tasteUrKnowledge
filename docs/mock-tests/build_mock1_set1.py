"""Builds Mock Test 1, Set 1 (Challenger): original content only.

English, Maths and Verbal items are written by hand; Maths answers and the
Verbal codes/series are recomputed here and asserted against the key. Every
Non-Verbal figure is drawn from its rule, so the picture always matches the
answer. Output: JSON for loading + an HTML preview for review.
"""
import json, math, random, re, sys
from fractions import Fraction
from pathlib import Path

OUT_DIR = Path(sys.argv[1])
OUT_DIR.mkdir(parents=True, exist_ok=True)
rng = random.Random(20261119)
LET = "ABCDE"

questions = []

def add(subject, topic, sub, qtype, quest, answer, distractors, explanation,
        stem=None, option_format="text", shuffle=True):
    opts = [answer] + list(distractors)
    assert len(opts) == 5, (quest, len(opts))
    assert len(set(opts)) == 5, ("duplicate options", quest, opts)
    if shuffle:
        rng.shuffle(opts)
    order = sum(1 for q in questions if q["subject"] == subject) + 1
    questions.append({
        "subject": subject, "questionOrder": order, "topic": topic,
        "subTopic": sub, "typeOfQuestion": qtype, "quest": quest,
        "stemFormat": "svg" if stem else "none", "stemFigure": stem,
        "optionFormat": option_format,
        **{f"option{LET[i]}": o for i, o in enumerate(opts)},
        "correctAnswer": LET[opts.index(answer)], "explanation": explanation,
    })

# =========================================================================
# ENGLISH - original passage
# =========================================================================
TITLE = "The Night the River Came Up"
STORY = """The warning came at four o'clock, not as a siren but as a rumour. It travelled along Mill Street faster than the rain itself: the river had climbed over the stone steps by the bridge, and it was still climbing. By the time it reached the bakery, it had grown teeth.

"They're saying the whole lower town will go under," announced Mrs Okafor from the doorway, shaking her umbrella so fiercely that she seemed to be punishing it.

Behind the counter, Gran did not look up from the dough she was folding. "They said that in 1998," she replied. "And the river only came as far as the post office. It is a river, Mrs Okafor. It has no ambition."

Leo, who had been sent to the bakery after school because his parents were both working late, said nothing. He was eleven, and he had learned that when adults argued in that particular polite tone, it was wisest to become furniture. Still, he edged towards the window. Mill Street had turned the colour of strong tea, and the drains were no longer swallowing the rain but coughing it back up.

By six, the rumour had become a fact. Water slid under the front door in a thin, glittering sheet. Gran finally put down the dough.

"Right," she said, and the single word did the work of a whole speech. "Flour sacks onto the top shelves. Then the till. Then the photographs."

Leo had always thought of the photographs as wallpaper. They hung in a crooked line above the ovens: men in flat caps, women with floury forearms, a boy no older than Leo holding a loaf almost as long as himself. He had walked past them a thousand times without looking. Now, lifting them down one by one, he found he could not stop looking.

"Who's this?" he asked, holding up the boy with the enormous loaf.

"Your great-grandfather, Arthur. That was taken the week he started here. He was twelve, and he hated every minute of it, to begin with."

"Why did he stay, then?"

Gran was quiet for so long that Leo thought she had not heard. The water was ankle-deep now and bitterly cold.

"Because one winter," she said at last, "the mill flooded and there was no bread anywhere in the town except here. Arthur's father kept the ovens going for three days, and people queued in the snow. Arthur said it was the first time he understood that a bakery isn't really about bread."

"What is it about, then?"

"You'll work it out," said Gran, which was what she always said when she wanted him to think rather than ask.

At half past seven, a man in a fluorescent jacket knocked on the window and told them, through the glass, that they must leave. Gran nodded politely, as though he were a customer asking the price of scones, and turned back to the ovens.

"Gran, he said we have to go."

"He said the street has to go," Gran corrected him. "The ovens are on the raised floor at the back. They'll stay dry for hours yet. And in the morning, there will be a great many people with wet kitchens and no breakfast."

Leo opened his mouth to argue and then, slowly, closed it again. He thought of Arthur at twelve, hating every minute. He thought of a queue of people in the snow. Somewhere inside his chest, something shifted, like a key turning in a stiff lock.

"What do you need me to do?"

Gran looked at him properly then: not the quick, checking look she gave him when he came in from school, but a long, measuring one, the kind she gave dough when she was deciding whether it was ready.

"Knead," she said, and pushed a bowl towards him.

They worked through the night. The river grumbled against the front of the shop like a dog that had been shut out, but it came no further than the second step of the raised floor. At dawn, as the water began its sulky retreat, the first neighbours appeared: Mrs Okafor, still clutching her umbrella; the man in the fluorescent jacket, looking sheepish; children in wellingtons with coats pulled over their pyjamas.

Leo handed out loaves until his arms ached. Nobody paid. Nobody was asked to.

Later, when the photographs were back on their hooks, a little more crooked than before, Leo stood in front of the picture of Arthur for a long time.

"I've worked it out," he told Gran.

She did not ask him what the answer was. She simply smiled and handed him a broom."""

E = "ENGLISH"
add(E, "Comprehension", None, "retrieval",
    "At what time did the warning about the river first reach Mill Street?",
    "Four o'clock", ["Six o'clock", "Half past seven", "Dawn", "Seven o'clock"],
    "The first line says the warning came at four o'clock.")
add(E, "Comprehension", None, "language effects",
    "\"By the time it reached the bakery, it had grown teeth.\" What does this suggest about the rumour?",
    "It had become more alarming as it spread",
    ["It had been proved to be false", "It had travelled more slowly than the rain",
     "It had been started by a dog", "It had turned into a joke"],
    "Saying the rumour had 'grown teeth' means it had become fiercer and more frightening as it was passed on.")
add(E, "Comprehension", None, "language effects",
    "Mrs Okafor shook her umbrella \"so fiercely that she seemed to be punishing it\". What does this show about her?",
    "She was agitated and worked up about the news",
    ["She was angry that her umbrella was broken", "She was trying to make Gran laugh",
     "She wanted to dry the umbrella before the shop closed", "She was calm and unconcerned"],
    "The violent shaking reflects how stirred up and anxious she is about the flood rumour.")
add(E, "Comprehension", None, "viewpoint",
    "When Gran says the river \"has no ambition\", what is her view at first?",
    "She believes it is unlikely to rise much further",
    ["She thinks it is the most dangerous river in the country", "She is planning to leave town",
     "She is afraid of what Mrs Okafor will do", "She thinks the river is beautiful"],
    "She compares it with 1998, when the water stopped at the post office, and dismisses the idea that it will go further.")
add(E, "Comprehension", None, "motivation",
    "Leo had learned that it was \"wisest to become furniture\". What does he decide to do?",
    "Keep quiet so that the adults do not notice him",
    ["Help to move the furniture away from the door", "Sit on a chair by the counter",
     "Hide underneath the counter", "Leave the bakery and go home"],
    "Furniture is silent and unnoticed; Leo stays out of the polite argument.")
add(E, "Comprehension", None, "language effects",
    "The drains were \"coughing it back up\". Which technique is the writer using here?",
    "Personification", ["Simile", "Alliteration", "Rhyme", "Onomatopoeia"],
    "The drains are given a human action (coughing), which is personification.")
add(E, "Comprehension", None, "multi-step reasoning",
    "\"The single word did the work of a whole speech.\" What does this tell us about Gran's word \"Right\"?",
    "It showed clearly that she had decided to take charge",
    ["She went on to give a long speech", "Leo could not hear what she said",
     "She was confused about what to do", "She was cross with Mrs Okafor"],
    "One word was enough to signal her decision and set everyone to work, as a speech might.")
add(E, "Comprehension", None, "viewpoint",
    "How did Leo's attitude to the photographs change during the evening?",
    "He had barely noticed them before, but now he could not stop looking",
    ["He had always loved them and wanted to hang more", "He became frightened of them and hid them",
     "He decided they were ugly and old-fashioned", "His attitude did not change at all"],
    "He had treated them 'as wallpaper', but lifting them down he 'could not stop looking'.")
add(E, "Comprehension", None, "retrieval",
    "How old was Arthur when the photograph of him was taken?",
    "Twelve", ["Eleven", "Ten", "Thirteen", "Fourteen"],
    "Gran says, 'He was twelve.' (Leo is the one who is eleven.)")
add(E, "Comprehension", None, "motivation",
    "According to Gran, why did Arthur stay at the bakery?",
    "He realised it helped the whole town during a crisis",
    ["His father paid him more than the mill did", "He enjoyed queuing in the snow",
     "The mill closed and there was no other work", "He wanted to be in more photographs"],
    "When the mill flooded, the bakery was the town's only bread; Arthur understood it was about more than bread.")
add(E, "Comprehension", None, "author's purpose",
    "Why does Gran answer \"You'll work it out\" instead of explaining?",
    "She wants Leo to think about it for himself",
    ["She does not know the answer", "She is annoyed by his questions",
     "She is too busy to talk", "She wants him to look it up later"],
    "The text says this is what she said 'when she wanted him to think rather than ask'.")
add(E, "Comprehension", None, "multi-step reasoning",
    "Why did Gran refuse to leave when the man in the fluorescent jacket told them to go?",
    "She knew the ovens would stay dry and people would need bread in the morning",
    ["She could not hear him through the glass", "She wanted to protect the photographs",
     "She thought the man was being rude", "She was frightened of going out in the rain"],
    "She explains the ovens are on a raised floor and that many people will have 'no breakfast'.")
add(E, "Comprehension", None, "language effects",
    "\"Something shifted, like a key turning in a stiff lock.\" What does this suggest is happening to Leo?",
    "He is beginning to understand and change his mind",
    ["He has found the key to the shop", "He is starting to feel unwell",
     "He is worried about being locked in", "He is becoming angry with Gran"],
    "A key turning opens something; Leo's understanding opens up and he offers to help.")
add(E, "Comprehension", None, "vocabulary",
    "Gran gave Leo \"a long, measuring\" look. Which is closest in meaning to \"measuring\" here?",
    "Carefully judging", ["Weighing out", "Counting quickly", "Unfriendly", "Hurried"],
    "She is assessing him, as she judges whether dough is ready.")
add(E, "Comprehension", None, "language effects",
    "The river \"grumbled against the front of the shop like a dog that had been shut out\". What impression does this give?",
    "The river was restless but could no longer get in",
    ["The river was growing more dangerous every minute", "The river was friendly and playful",
     "The river had gone completely silent", "The river had already dried up"],
    "A shut-out dog grumbles at the door but stays outside; the water came no further than the second step.")
add(E, "Comprehension", None, "motivation",
    "Why did the man in the fluorescent jacket look \"sheepish\" at dawn?",
    "He was embarrassed, having told them to leave, yet now he had come for bread",
    ["He was cold after working all night", "He had lost his fluorescent jacket",
     "He was angry that the shop was still open", "He was too tired to speak"],
    "Sheepish means embarrassed; he benefits from the decision he had told them not to make.")
add(E, "Comprehension", None, "author's purpose",
    "What has Leo \"worked out\" by the end of the story?",
    "That a bakery is really about looking after the community",
    ["How to bake bread without an oven", "How to stop a river from flooding",
     "That the photographs should hang straight", "That Gran had been wrong about the river"],
    "It answers his earlier question: like Arthur, he sees the bakery serves people in need.")
add(E, "Comprehension", None, "author's purpose",
    "Why does the writer end the story with Gran handing Leo a broom?",
    "To show quietly that Gran now treats him as a real helper and the work goes on",
    ["To show that Gran is cross with Leo", "To explain how the flood was cleaned up",
     "To make the reader laugh at Leo", "To show that the shop is closing down"],
    "The understated ending suggests acceptance: she doesn't need to ask his answer, she trusts him with the work.")

# =========================================================================
# MATHS - answers recomputed and asserted
# =========================================================================
M = "MATHS"
def money(p):  # pence -> "£x.yy"
    return f"£{p // 100}.{p % 100:02d}"

assert 4836 // 12 == 403 and 4836 % 12 == 0
add(M, "Number", "Division", "calculation", "What is 4,836 ÷ 12?",
    "403", ["43", "430", "413", "4,030"], "12 × 400 = 4,800 and 12 × 3 = 36, so 4,836 ÷ 12 = 403.")
assert Fraction(3, 8) * 288 == 108
add(M, "Fractions", "Fraction of an amount", "calculation", "What is 3/8 of 288?",
    "108", ["96", "36", "112", "104"], "288 ÷ 8 = 36, and 36 × 3 = 108.")
assert 8400 * 85 // 100 == 7140
add(M, "Percentages", "Percentage decrease", "word problem",
    "A coat costs £84. In a sale its price is reduced by 15%. What is the sale price?",
    money(7140), [money(6900), money(7260), money(7040), money(1260)],
    "15% of £84 is £12.60, so the sale price is £84 − £12.60 = £71.40.")
assert 36 // 9 * 5 == 20
add(M, "Ratio", "Sharing in a ratio", "word problem",
    "In a club the ratio of boys to girls is 4 : 5. There are 36 children. How many are girls?",
    "20", ["16", "9", "18", "25"], "4 + 5 = 9 parts; 36 ÷ 9 = 4 per part; girls = 5 × 4 = 20.")
assert (31 - 7) / 2 == 12
add(M, "Algebra", "Equations", "calculation", "If 2n + 7 = 31, what is n?",
    "12", ["19", "24", "14", "11"], "2n = 31 − 7 = 24, so n = 12.")
seq = [5, 8, 14, 26, 50]
assert all(seq[i + 1] == seq[i] * 2 - 2 for i in range(4))
add(M, "Number", "Sequences", "pattern", "What is the next number? 5, 8, 14, 26, 50, …",
    str(50 * 2 - 2), ["74", "100", "96", "102"], "Each term is double the previous one, minus 2: 50 × 2 − 2 = 98.")
assert sum([14, 9, 17, 12, 8]) / 5 == 12
add(M, "Statistics", "Mean", "calculation", "What is the mean of 14, 9, 17, 12 and 8?",
    "12", ["9", "17", "11", "13"], "Total = 60; 60 ÷ 5 = 12.")

L_SHAPE = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" width="300" height="225">'
           '<polygon points="30,20 102,20 102,56 150,56 150,116 30,116" fill="#e0f2fe" stroke="#1f2937" stroke-width="2"/>'
           '<text x="66" y="14" font-size="11" text-anchor="middle" fill="#1f2937">6 cm</text>'
           '<text x="160" y="90" font-size="11" fill="#1f2937">5 cm</text>'
           '<text x="90" y="132" font-size="11" text-anchor="middle" fill="#1f2937">10 cm</text>'
           '<text x="24" y="72" font-size="11" text-anchor="end" fill="#1f2937">8 cm</text>'
           '<text x="90" y="146" font-size="9" text-anchor="middle" fill="#6b7280">Not drawn to scale</text></svg>')
assert 10 * 8 - (10 - 6) * (8 - 5) == 68
add(M, "Shape", "Area of compound shapes", "diagram",
    "The shape is made of rectangles and all corners are right angles. What is its area?",
    "68 cm²", ["80 cm²", "74 cm²", "56 cm²", "62 cm²"],
    "Whole rectangle 10 × 8 = 80. The missing corner is (10 − 6) × (8 − 5) = 4 × 3 = 12. 80 − 12 = 68 cm².",
    stem=L_SHAPE)
assert (11 * 60 + 22) - (9 * 60 + 47) == 95
add(M, "Measures", "Time", "word problem",
    "A train leaves at 09:47 and arrives at 11:22. How long is the journey?",
    "1 h 35 min", ["1 h 25 min", "1 h 75 min", "2 h 35 min", "1 h 45 min"],
    "09:47 to 10:47 is 1 hour; 10:47 to 11:22 is 35 minutes.")
assert Fraction(6, 10) * Fraction(7, 100) == Fraction(42, 1000)
add(M, "Number", "Decimals", "calculation", "What is 0.6 × 0.07?",
    "0.042", ["0.42", "0.0042", "4.2", "0.13"], "6 × 7 = 42 and there are three decimal places in total: 0.042.")
assert 180 - 48 - 67 == 65
add(M, "Shape", "Angles", "calculation",
    "Two angles of a triangle are 48° and 67°. What is the third angle?",
    "65°", ["75°", "55°", "115°", "35°"], "Angles in a triangle add up to 180°: 180 − 48 − 67 = 65°.")
vals = {"3/5": 0.6, "0.58": 0.58, "62%": 0.62, "5/8": 0.625, "0.61": 0.61}
assert max(vals, key=vals.get) == "5/8"
add(M, "Fractions", "Comparing", "reasoning", "Which of these is the largest?",
    "5/8", ["3/5", "0.58", "62%", "0.61"], "As decimals: 0.6, 0.58, 0.62, 0.625, 0.61. 5/8 = 0.625 is the largest.")
assert 500 - (6 * 35 + 5 * 18) == 200
add(M, "Measures", "Money", "word problem",
    "Pens cost 35p each and pencils cost 18p each. Sam buys 6 pens and 5 pencils and pays with a £5 note. How much change does he get?",
    money(200), [money(300), money(210), money(190), money(290)],
    "6 × 35p = £2.10 and 5 × 18p = 90p. Total £3.00; change from £5 is £2.00.")
assert round(47368, -3) == 47000
add(M, "Number", "Rounding", "calculation", "Round 47,368 to the nearest thousand.",
    "47,000", ["48,000", "47,400", "47,370", "50,000"], "The hundreds digit is 3 (less than 5), so it rounds down to 47,000.")
side = round(125 ** (1 / 3)); assert side ** 3 == 125
add(M, "Shape", "Volume and surface area", "multi-step",
    "A cube has a volume of 125 cm³. What is its total surface area?",
    f"{6 * side * side} cm²", ["25 cm²", "100 cm²", "125 cm²", "75 cm²"],
    "The side is 5 cm (5 × 5 × 5 = 125). Each face is 25 cm² and there are 6 faces: 150 cm².")
primes = [p for p in range(21, 40) if all(p % d for d in range(2, p))]
assert primes == [23, 29, 31, 37] and sum(primes) == 120
add(M, "Number", "Primes", "multi-step", "What is the sum of all the prime numbers between 20 and 40?",
    "120", ["89", "97", "111", "131"], "The primes are 23, 29, 31 and 37; 23 + 29 + 31 + 37 = 120.")
add(M, "Shape", "Coordinates and reflection", "reasoning",
    "The point (3, −2) is reflected in the x-axis. What are the coordinates of its image?",
    "(3, 2)", ["(−3, −2)", "(−3, 2)", "(2, 3)", "(−2, 3)"],
    "Reflecting in the x-axis keeps x the same and changes the sign of y: (3, 2).")
assert 4 * 1500 // 250 == 24
add(M, "Measures", "Capacity", "word problem",
    "A jug holds 1.5 litres. How many 250 ml glasses can be filled from 4 full jugs?",
    "24", ["6", "16", "20", "30"], "4 × 1.5 l = 6 l = 6,000 ml; 6,000 ÷ 250 = 24.")
a, b = 4, 3; assert 3 * a * a - 2 * b == 42
add(M, "Algebra", "Substitution", "calculation", "If a = 4 and b = 3, what is the value of 3a² − 2b?",
    "42", ["138", "18", "30", "46"], "a² = 16; 3 × 16 = 48; 2b = 6; 48 − 6 = 42.")
assert Fraction(3 + 4, 3 + 5 + 4) == Fraction(7, 12)
add(M, "Statistics", "Probability", "reasoning",
    "A bag has 3 red, 5 blue and 4 green counters. One is taken at random. What is the probability that it is NOT blue?",
    "7/12", ["5/12", "1/3", "1/4", "2/3"], "12 counters, 7 of which are not blue: 7/12.")

# =========================================================================
# VERBAL REASONING
# =========================================================================
V = "VERBAL"
def shift(word, k):
    return "".join(chr((ord(c) - 65 + k) % 26 + 65) for c in word)

assert shift("FROST", 2) == "HTQUV"
add(V, "Codes", "Letter shift", "letter code",
    "In a code, FROST is written as HTQUV. How would BLANK be written in the same code?",
    shift("BLANK", 2), [shift("BLANK", 1), shift("BLANK", 3), shift("BLANK", -2), "DNCPL"],
    "Each letter moves two places forward in the alphabet: B→D, L→N, A→C, N→P, K→M.")
assert shift("MOTHER", 1) == "NPUIFS" and shift("UBCMF", -1) == "TABLE"
add(V, "Codes", "Decoding", "letter code",
    "In a code, MOTHER is written as NPUIFS. What does the code UBCMF stand for?",
    "TABLE", ["CABLE", "FABLE", "SABLE", "VCDNG"],
    "Each code letter is one place after the real letter, so move each back one: U→T, B→A, C→B, M→L, F→E.")
pairs = ["AZ", "CX", "EV", "GT"]
nxt = chr(ord(pairs[-1][0]) + 2) + chr(ord(pairs[-1][1]) - 2)
assert nxt == "IR"
add(V, "Series", "Letter pairs", "letter series", "Find the next pair in the series: AZ, CX, EV, GT, ?",
    nxt, ["HS", "IQ", "JR", "IS"],
    "The first letter moves forward two each time (A, C, E, G, I); the second moves back two (Z, X, V, T, R).")
s = [3, 4, 7, 11, 18, 29]; assert all(s[i] == s[i - 1] + s[i - 2] for i in range(2, 6))
add(V, "Series", "Number series", "number series", "Find the next number: 3, 4, 7, 11, 18, 29, ?",
    str(s[-1] + s[-2]), ["40", "45", "58", "36"], "Each number is the sum of the two before it: 18 + 29 = 47.")
s = [20, 17, 19, 16, 18]
assert [s[i + 1] - s[i] for i in range(4)] == [-3, 2, -3, 2]
add(V, "Series", "Number series", "number series", "Find the next number: 20, 17, 19, 16, 18, ?",
    str(18 - 3), ["17", "14", "20", "13"], "The pattern is −3, +2, −3, +2, so next is 18 − 3 = 15.")

def hides(pair, word):
    a, b = pair.lower().split()
    joined = a + b
    return any(joined[i:i + len(word)] == word and i < len(a) < i + len(word)
               for i in range(len(joined)))
assert hides("the attic", "heat")
add(V, "Hidden words", "Across two words", "hidden word",
    "A four-letter word is hidden across the end of one word and the start of the next. Which pair hides it?\n\"Make sure the attic door is shut.\"",
    "the attic", ["Make sure", "sure the", "attic door", "door is"],
    "the attic → t(HE AT)tic hides the word HEAT.")
assert hides("Thomas eats", "seat")
add(V, "Hidden words", "Across two words", "hidden word",
    "A four-letter word is hidden across the end of one word and the start of the next. Which pair hides it?\n\"Thomas eats his lunch quickly.\"",
    "Thomas eats", ["eats his", "his lunch", "lunch quickly", "None of these"],
    "Thoma(S EAT)s hides the word SEAT.")
add(V, "Vocabulary", "Synonyms", "synonym", "Which word is closest in meaning to RELUCTANT?",
    "unwilling", ["eager", "exhausted", "careful", "silent"], "Reluctant means not wanting to do something: unwilling.")
add(V, "Vocabulary", "Antonyms", "antonym", "Which word is most nearly the OPPOSITE of SCARCE?",
    "plentiful", ["rare", "tiny", "expensive", "hidden"], "Scarce means in short supply; the opposite is plentiful.")
add(V, "Vocabulary", "Odd one out", "classification", "Which word does NOT belong with the others?",
    "tulip", ["oak", "birch", "willow", "ash"], "Oak, birch, willow and ash are trees; a tulip is a flower.")
add(V, "Word building", "Compound words", "compound word",
    "Which word can go in front of all of these to make three new words?  ___ball   ___flake   ___man",
    "snow", ["foot", "sun", "rain", "hand"], "snowball, snowflake, snowman. (Foot works for football only.)")
add(V, "Vocabulary", "Analogies", "analogy", "Bird is to nest as bee is to ?",
    "hive", ["honey", "flower", "sting", "wing"], "A nest is where a bird lives; a hive is where a bee lives.")
add(V, "Word building", "Missing letter", "missing letter",
    "Which letter completes both words?  mil (?)   (?) ite",
    "k", ["l", "d", "e", "t"], "milk and kite. (mill + lite, mild + dite and mile + eite do not make two real words.)")
words = ["brave", "branch", "bread", "brand", "bracket"]
assert sorted(words)[2] == "brand"
add(V, "Alphabet", "Alphabetical order", "alphabetical order",
    "If these words were put in alphabetical order, which would come THIRD?\nbrave   branch   bread   brand   bracket",
    "brand", ["brave", "branch", "bread", "bracket"], "Order: bracket, branch, brand, brave, bread. The third is brand.")
assert "SPLIT".replace("L", "", 1) == "SPIT"
add(V, "Word building", "Move a letter", "move a letter",
    "Move one letter from the first word into the second to make two new words: SPLIT   CAN. Which letter moves?",
    "L", ["S", "P", "I", "T"], "Taking L from SPLIT leaves SPIT; adding it to CAN makes CLAN.")
code = {"M": "5", "A": "9", "T": "2", "E": "6"}
enc = lambda w: "".join(code[c] for c in w)
assert sorted([enc("MATE"), enc("TAME"), enc("TEAM")]) == sorted(["5926", "2956", "2695"])
add(V, "Codes", "Number codes", "number code",
    "The words MATE, TAME and TEAM are written in a number code. The codes, in no particular order, are 5926, 2956 and 2695. What is the code for MEAT?",
    enc("MEAT"), ["6592", "5629", "2569", "9562"],
    "TAME and TEAM both start with T, so 2 = T; the code starting 5 is MATE (5926), giving M=5, A=9, T=2, E=6. MEAT = 5692.")
assert 7 * 6 == 50 - 8
add(V, "Number", "Balancing sums", "missing number", "Find the missing number: 7 × 6 = 50 − ?",
    "8", ["6", "12", "2", "9"], "7 × 6 = 42 and 50 − 8 = 42.")
assert "LIVE"[::-1] == "EVIL" and "DRAW"[::-1] == "WARD"
add(V, "Word building", "Word patterns", "word pattern",
    "LIVE becomes EVIL in the same way that DRAW becomes ?",
    "WARD", ["DRAW", "WADR", "RAWD", "WORD"], "The letters are reversed: LIVE → EVIL, DRAW → WARD.")
val = {"A": 3, "B": 5, "C": 2, "D": 10, "E": 6}
r = val["D"] * val["C"] - val["A"] * val["E"]
ans = [k for k, v in val.items() if v == r][0]
assert ans == "C"
add(V, "Number", "Letters for numbers", "letter sum",
    "If A = 3, B = 5, C = 2, D = 10 and E = 6, what is (D × C) − (A × E)? Give your answer as a letter.",
    "C", ["A", "B", "D", "E"], "D × C = 20 and A × E = 18; 20 − 18 = 2, which is C.", shuffle=False)
# fixed order A-E for this one so option text matches its letter
questions[-1].update({f"option{l}": l for l in LET}, correctAnswer="C")
order_old = ["Amira", "Ben", "Eli", "Chloe", "Dev"]
add(V, "Logic", "Ordering", "logic",
    "Amira is older than Ben. Chloe is younger than Ben but older than Dev. Eli is older than Chloe but younger than Ben. Who is the second youngest?",
    order_old[-2], ["Amira", "Ben", "Eli", "Dev"],
    "Oldest to youngest: Amira, Ben, Eli, Chloe, Dev. The second youngest is Chloe.")

# =========================================================================
# NON-VERBAL REASONING - every figure drawn from its rule
# =========================================================================
N = "NON_VERBAL"
INK, GREY, WHITE = "#1f2937", "#9ca3af", "#ffffff"

def svg(inner, w=80, h=80):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{inner}</svg>'

def poly_pts(n, cx=40, cy=40, r=24, rot=-90):
    return " ".join(f"{cx + r * math.cos(math.radians(rot + 360 * i / n)):.1f},"
                    f"{cy + r * math.sin(math.radians(rot + 360 * i / n)):.1f}" for i in range(n))

def shape(kind, fill=WHITE, cx=40, cy=40, r=24):
    if kind == "circle":
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{INK}" stroke-width="2"/>'
    n = {"triangle": 3, "square": 4, "pentagon": 5, "hexagon": 6, "heptagon": 7, "octagon": 8}[kind]
    rot = -45 if n == 4 else -90
    return f'<polygon points="{poly_pts(n, cx, cy, r, rot)}" fill="{fill}" stroke="{INK}" stroke-width="2"/>'

def dots(n, cx=40, cy=40, r=3, gap=10, cols=None):
    cols = cols or min(n, 4)
    rows = math.ceil(n / cols)
    out = []
    for i in range(n):
        row, col = divmod(i, cols)
        in_row = min(cols, n - row * cols)
        x = cx + (col - (in_row - 1) / 2) * gap
        y = cy + (row - (rows - 1) / 2) * gap
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{INK}"/>')
    return "".join(out)

ARROW = '<polygon points="37,62 43,62 43,32 52,32 40,16 28,32 37,32" fill="{f}" stroke="{s}" stroke-width="1.5" transform="rotate({a} 40 40)"/>'
def arrow(a, fill=INK):
    return ARROW.format(a=a, f=fill, s=INK)

def frame_strip(cells, question=True):
    cells = list(cells) + (["?"] if question else [])
    w = len(cells) * 90
    out = []
    for i, c in enumerate(cells):
        x = i * 90 + 5
        out.append(f'<g transform="translate({x},5)"><rect x="0" y="0" width="80" height="80" rx="6" fill="{WHITE}" stroke="{GREY}" stroke-width="1.5"/>')
        out.append('<text x="40" y="52" font-size="32" text-anchor="middle" fill="#6b7280">?</text>' if c == "?" else c)
        out.append("</g>")
    return svg("".join(out), w, 90)

def opt(inner):
    return svg(inner)

def add_nvr(topic, sub, qtype, quest, stem, answer, distractors, explanation, option_format="svg"):
    add(N, topic, sub, qtype, quest, answer, distractors, explanation, stem=stem, option_format=option_format)

# 1 Sequence: arrow turns 45° clockwise
add_nvr("Sequences", "Rotation", "sequence", "Which figure comes next in the sequence?",
        frame_strip([arrow(a) for a in (0, 45, 90, 135)]),
        opt(arrow(180)), [opt(arrow(a)) for a in (135, 225, 270, 0)],
        "The arrow turns 45° clockwise each time, so after 135° it points at 180° (straight down).")
# 2 Sequence: dots go up by two
add_nvr("Sequences", "Counting", "sequence", "Which figure comes next in the sequence?",
        frame_strip([dots(n) for n in (1, 3, 5, 7)]),
        opt(dots(9)), [opt(dots(n)) for n in (8, 10, 7, 11)],
        "Two more dots are added each time: 1, 3, 5, 7, so 9 comes next.")
# 3 Sequence: one more side each time
add_nvr("Sequences", "Sides", "sequence", "Which figure comes next in the sequence?",
        frame_strip([shape(k) for k in ("triangle", "square", "pentagon", "hexagon")]),
        opt(shape("heptagon")), [opt(shape(k)) for k in ("octagon", "hexagon", "pentagon", "circle")],
        "Each shape has one more side: 3, 4, 5, 6, so a 7-sided shape (heptagon) is next.")
# 4 Sequence: shaded quarter moves clockwise
QUAD = {"TL": (12, 12), "TR": (40, 12), "BR": (40, 40), "BL": (12, 40)}
def quarter(*qs):
    base = f'<rect x="12" y="12" width="56" height="56" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
    fills = "".join(f'<rect x="{QUAD[q][0]}" y="{QUAD[q][1]}" width="28" height="28" fill="{INK}"/>' for q in qs)
    lines = f'<line x1="40" y1="12" x2="40" y2="68" stroke="{INK}" stroke-width="1.5"/><line x1="12" y1="40" x2="68" y2="40" stroke="{INK}" stroke-width="1.5"/>'
    return base + fills + lines
add_nvr("Sequences", "Position", "sequence", "Which figure comes next in the sequence?",
        frame_strip([quarter(q) for q in ("TL", "TR", "BR", "BL", "TL", "TR")]),
        opt(quarter("BR")), [opt(quarter(q)) for q in ("TL", "TR", "BL")] + [opt(quarter("TR", "BR"))],
        "The shaded quarter moves one place clockwise each time: TL, TR, BR, BL, TL, TR, so bottom-right is next.")
# 5 Sequence: ball moves round the corners, fill alternates
CORNER = [(20, 20), (60, 20), (60, 60), (20, 60)]
def ball(i, black):
    x, y = CORNER[i % 4]
    return (f'<rect x="10" y="10" width="60" height="60" fill="none" stroke="{GREY}" stroke-width="1.5"/>'
            f'<circle cx="{x}" cy="{y}" r="8" fill="{INK if black else WHITE}" stroke="{INK}" stroke-width="2"/>')
add_nvr("Sequences", "Two rules", "sequence", "Which figure comes next in the sequence?",
        frame_strip([ball(i, i % 2 == 0) for i in range(4)]),
        opt(ball(4, True)), [opt(ball(4, False)), opt(ball(1, True)), opt(ball(3, True)), opt(ball(2, False))],
        "The circle moves one corner clockwise each time and alternates black, white. Frame 5 is top-left and black.")
# 6 Odd one out: mirror image L
L_PTS = "25,15 37,15 37,50 57,50 57,62 25,62"
def lshape(a, mirror=False):
    m = ' transform="translate(80,0) scale(-1,1)"' if mirror else ""
    return f'<g transform="rotate({a} 40 40)"><g{m}><polygon points="{L_PTS}" fill="{GREY}" stroke="{INK}" stroke-width="2"/></g></g>'
add_nvr("Odd one out", "Reflection", "odd one out", "Which figure is the odd one out?", None,
        opt(lshape(90, mirror=True)), [opt(lshape(a)) for a in (0, 90, 180, 270)],
        "Four figures are the same L-shape turned round. The odd one out is a mirror image, which cannot be made by turning.")
# 7 Odd one out: dots should equal sides
pairs = [("triangle", 3), ("square", 4), ("pentagon", 5), ("hexagon", 6)]
add_nvr("Odd one out", "Counting", "odd one out", "Which figure is the odd one out?", None,
        opt(shape("pentagon") + dots(4, r=2.5, gap=8, cols=2)),
        [opt(shape(k) + dots(n, r=2.5, gap=8, cols=2 if n == 4 else 3)) for k, n in pairs],
        "In the others, the number of dots equals the number of sides. The pentagon with 4 dots breaks the rule.")
# 8 Odd one out: inner shape matches outer
def nested(outer, inner):
    return shape(outer, r=28) + shape(inner, fill=GREY, r=11)
add_nvr("Odd one out", "Matching shapes", "odd one out", "Which figure is the odd one out?", None,
        opt(nested("square", "triangle")),
        [opt(nested(k, k)) for k in ("square", "triangle", "circle", "hexagon")],
        "In every other figure the small shape is the same as the large one. A triangle inside a square does not match.")
# 9 Odd one out: four black cells vs five
def grid(cells):
    out = []
    for i in range(9):
        r, c = divmod(i, 3)
        out.append(f'<rect x="{13 + c * 18}" y="{13 + r * 18}" width="18" height="18" '
                   f'fill="{INK if i in cells else WHITE}" stroke="{INK}" stroke-width="1.5"/>')
    return "".join(out)
four = [{0, 2, 4, 8}, {1, 3, 5, 7}, {0, 1, 6, 7}, {2, 4, 6, 8}]
assert all(len(s) == 4 for s in four)
add_nvr("Odd one out", "Counting", "odd one out", "Which figure is the odd one out?", None,
        opt(grid({0, 3, 4, 5, 8})), [opt(grid(s)) for s in four],
        "Four grids have exactly 4 black squares; the odd one out has 5.")
# 10 Analogy: turn 90° clockwise
def flag(a):
    return (f'<g transform="rotate({a} 40 40)"><line x1="32" y1="64" x2="32" y2="16" stroke="{INK}" stroke-width="3"/>'
            f'<polygon points="32,16 56,26 32,36" fill="{INK}"/></g>')
def key(a, mirror=False):
    m = ' transform="translate(80,0) scale(-1,1)"' if mirror else ""
    return (f'<g transform="rotate({a} 40 40)"><g{m}><circle cx="40" cy="58" r="7" fill="{WHITE}" stroke="{INK}" stroke-width="2.5"/>'
            f'<line x1="40" y1="51" x2="40" y2="16" stroke="{INK}" stroke-width="3"/>'
            f'<line x1="40" y1="20" x2="52" y2="20" stroke="{INK}" stroke-width="3"/>'
            f'<line x1="40" y1="28" x2="49" y2="28" stroke="{INK}" stroke-width="3"/></g></g>')
def analogy(a, b, c):
    cells = []
    for i, (x, inner) in enumerate([(5, a), (125, b), (245, c), (365, None)]):
        cells.append(f'<g transform="translate({x},5)"><rect width="80" height="80" rx="6" fill="{WHITE}" stroke="{GREY}" stroke-width="1.5"/>')
        cells.append(inner if inner else '<text x="40" y="52" font-size="32" text-anchor="middle" fill="#6b7280">?</text>')
        cells.append("</g>")
    cells.append('<text x="105" y="52" font-size="22" text-anchor="middle" fill="#6b7280">→</text>')
    cells.append('<text x="225" y="52" font-size="18" text-anchor="middle" fill="#6b7280">as</text>')
    cells.append('<text x="345" y="52" font-size="22" text-anchor="middle" fill="#6b7280">→</text>')
    return svg("".join(cells), 450, 90)
add_nvr("Analogies", "Rotation", "analogy",
        "The first figure changes into the second. Which option changes in the same way from the third figure?",
        analogy(flag(0), flag(90), key(0)),
        opt(key(90)), [opt(key(270)), opt(key(180)), opt(key(0, mirror=True)), opt(flag(90))],
        "The first figure turns 90° clockwise. Turning the third figure 90° clockwise gives the answer.")
# 11 Analogy: colours swap
def pair(outer, inner, outer_fill, inner_fill):
    return shape(outer, fill=outer_fill, r=28) + shape(inner, fill=inner_fill, r=12)
add_nvr("Analogies", "Colour swap", "analogy",
        "The first figure changes into the second. Which option changes in the same way from the third figure?",
        analogy(pair("square", "circle", WHITE, INK), pair("square", "circle", INK, WHITE),
                pair("hexagon", "triangle", WHITE, INK)),
        opt(pair("hexagon", "triangle", INK, WHITE)),
        [opt(pair("hexagon", "triangle", WHITE, INK)), opt(pair("hexagon", "triangle", INK, INK)),
         opt(pair("triangle", "hexagon", INK, WHITE)), opt(pair("hexagon", "triangle", WHITE, WHITE))],
        "The colours of the outer and inner shapes swap. The hexagon becomes black and the triangle white.")
# 12 Analogy: sizes swap
def sizes(first, second, swapped=False):
    """first starts large and white, second small and grey; swapped reverses the sizes."""
    if not swapped:
        return shape(first, fill=WHITE, cx=32, cy=44, r=24) + shape(second, fill=GREY, cx=62, cy=18, r=10)
    return shape(second, fill=GREY, cx=50, cy=34, r=22) + shape(first, fill=WHITE, cx=24, cy=58, r=10)
add_nvr("Analogies", "Size swap", "analogy",
        "The first figure changes into the second. Which option changes in the same way from the third figure?",
        analogy(sizes("circle", "square"), sizes("circle", "square", swapped=True), sizes("triangle", "circle")),
        opt(sizes("triangle", "circle", swapped=True)),
        [opt(sizes("triangle", "circle")), opt(sizes("circle", "triangle", swapped=True)),
         opt(sizes("circle", "triangle")), opt(sizes("triangle", "square", swapped=True))],
        "The large white shape becomes small and the small grey shape becomes large; each keeps its shading.")
# 13-14 Reflection in a vertical mirror line
def mirror_stem(inner):
    return svg(f'<g transform="translate(5,5)">{inner}</g><line x1="92" y1="4" x2="92" y2="86" stroke="{INK}" stroke-width="2" stroke-dasharray="5,4"/>', 100, 90)
def tf(inner, t):
    return f'<g transform="{t}">{inner}</g>'
HFLIP, VFLIP = "translate(80,0) scale(-1,1)", "translate(0,80) scale(1,-1)"
P1 = f'<polygon points="18,14 50,14 62,34 40,34 40,66 18,66" fill="{GREY}" stroke="{INK}" stroke-width="2"/><circle cx="28" cy="24" r="4" fill="{INK}"/>'
add_nvr("Reflection", "Vertical mirror", "reflection",
        "Which option shows the figure reflected in the dashed mirror line?", mirror_stem(P1),
        opt(tf(P1, HFLIP)), [opt(P1), opt(tf(P1, VFLIP)), opt(tf(P1, "rotate(180 40 40)")), opt(tf(P1, "rotate(90 40 40)"))],
        "A reflection in a vertical line swaps left and right but keeps top and bottom.")
P2 = (f'<polygon points="20,60 20,20 44,20 60,36 44,36 44,60" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
      f'<polygon points="24,54 24,44 34,54" fill="{INK}"/>')
add_nvr("Reflection", "Vertical mirror", "reflection",
        "Which option shows the figure reflected in the dashed mirror line?", mirror_stem(P2),
        opt(tf(P2, HFLIP)), [opt(P2), opt(tf(P2, VFLIP)), opt(tf(P2, "rotate(180 40 40)")), opt(tf(tf(P2, HFLIP), "rotate(90 40 40)"))],
        "Left and right swap: the point on the right of the shape moves to the left, and the black triangle stays at the bottom.")
# 15 Rotation 90° clockwise
P3 = (f'<polygon points="16,24 52,24 52,14 66,30 52,46 52,36 16,36" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
      f'<circle cx="24" cy="56" r="7" fill="{INK}"/>')
add_nvr("Rotation", "Quarter turn", "rotation",
        "Which option shows the figure turned 90° clockwise?", frame_strip([P3], question=False),
        opt(tf(P3, "rotate(90 40 40)")),
        [opt(tf(P3, "rotate(-90 40 40)")), opt(tf(P3, "rotate(180 40 40)")),
         opt(tf(tf(P3, HFLIP), "rotate(90 40 40)")), opt(P3)],
        "Turning 90° clockwise makes the arrow point down, with the black circle moving to the top-left.")
# 16 Matrix 2x2: white becomes black
def matrix(cells, n):
    out = []
    for i, c in enumerate(cells + ["?"]):
        r, col = divmod(i, n)
        out.append(f'<g transform="translate({5 + col * 88},{5 + r * 88})"><rect width="80" height="80" rx="6" fill="{WHITE}" stroke="{GREY}" stroke-width="1.5"/>')
        out.append('<text x="40" y="52" font-size="32" text-anchor="middle" fill="#6b7280">?</text>' if c == "?" else c)
        out.append("</g>")
    return svg("".join(out), n * 88 + 2, n * 88 + 2)
add_nvr("Matrices", "2 × 2", "matrix", "Which option completes the grid?",
        matrix([shape("pentagon") + dots(1, r=4), shape("pentagon", fill=INK) + f'<circle cx="40" cy="40" r="4" fill="{WHITE}"/>',
                shape("triangle", r=26) + dots(2, cy=46, r=4)], 2),
        opt(shape("triangle", fill=INK, r=26) + f'<circle cx="35" cy="46" r="4" fill="{WHITE}"/><circle cx="45" cy="46" r="4" fill="{WHITE}"/>'),
        [opt(shape("triangle", r=26) + dots(2, cy=46, r=4)),
         opt(shape("triangle", fill=INK, r=26) + f'<circle cx="40" cy="46" r="4" fill="{WHITE}"/>'),
         opt(shape("pentagon", fill=INK) + f'<circle cx="35" cy="40" r="4" fill="{WHITE}"/><circle cx="45" cy="40" r="4" fill="{WHITE}"/>'),
         opt(shape("triangle", fill=GREY, r=26) + dots(2, cy=46, r=4))],
        "Across each row, the colours reverse: the shape turns black and its dots turn white. The dots stay the same in number.")
# 17 Matrix 3x3: shape by row, dot count by column
rows, counts = ["circle", "square", "triangle"], [1, 2, 3]
def cell(k, n):
    return shape(k, r=26) + (dots(n, cy=47, r=2.5, gap=7) if k == "triangle" else dots(n, r=3, gap=9))
cells = [cell(k, n) for k in rows for n in counts][:-1]
add_nvr("Matrices", "3 × 3", "matrix", "Which option completes the grid?", matrix(cells, 3),
        opt(cell("triangle", 3)), [opt(cell("triangle", 2)), opt(cell("square", 3)), opt(cell("circle", 3)), opt(cell("triangle", 4))],
        "Each row keeps the same shape; each column has the same number of dots. The missing cell is a triangle with 3 dots.")
# 18 Codes: shape letter + fill letter
SH = {"circle": "L", "square": "M", "triangle": "N"}
FL = {INK: "X", WHITE: "Y", GREY: "Z"}
def code_stem(examples, target):
    out = []
    for i, inner in enumerate([e for e, _ in examples] + [target]):
        x = 5 + i * 90
        out.append(f'<g transform="translate({x},5)"><rect width="80" height="80" rx="6" fill="{WHITE}" stroke="{GREY}" stroke-width="1.5"/>{inner}</g>')
        label = examples[i][1] if i < len(examples) else "?"
        out.append(f'<text x="{x + 40}" y="104" font-size="16" font-weight="bold" text-anchor="middle" fill="{INK}">{label}</text>')
    return svg("".join(out), (len(examples) + 1) * 90, 112)
ex = [("circle", INK), ("square", WHITE), ("triangle", GREY), ("circle", WHITE)]
add_nvr("Codes", "Two-letter codes", "code",
        "Each figure has a code. The first letter stands for one feature and the second letter for another. What is the code for the last figure?",
        code_stem([(shape(k, fill=f, r=26), SH[k] + FL[f]) for k, f in ex], shape("square", fill=GREY, r=26)),
        SH["square"] + FL[GREY], ["MX", "NZ", "LZ", "ZM"],
        "The first letter is the shape (L circle, M square, N triangle); the second is the shading (X black, Y white, Z grey). A grey square is MZ.",
        option_format="text")
# 19 Codes: direction + number of arrows
DIR = {0: "P", 90: "Q", 180: "R", 270: "S"}
CNT = {1: "F", 2: "G"}
def arrows(a, n):
    if n == 1:
        return arrow(a)
    # Two parallel arrows side by side, then turned together.
    return (f'<g transform="rotate({a} 40 40)"><g transform="translate(-14,0)">{arrow(0)}</g>'
            f'<g transform="translate(14,0)">{arrow(0)}</g></g>')
ex = [(0, 1), (90, 2), (270, 1), (0, 2)]
add_nvr("Codes", "Two-letter codes", "code",
        "Each figure has a code. The first letter stands for one feature and the second letter for another. What is the code for the last figure?",
        code_stem([(arrows(a, n), DIR[a] + CNT[n]) for a, n in ex], arrows(180, 2)),
        DIR[180] + CNT[2], ["RF", "GR", "QG", "PG"],
        "The first letter is the direction (P up, Q right, S left, so R is down); the second is the number of arrows (F one, G two). Two arrows pointing down is RG.",
        option_format="text")
# 20 Sequence: thick side moves round a hexagon, centre dot alternates
def hexside(i, dot):
    pts = [(40 + 26 * math.cos(math.radians(-90 + 60 * k)), 40 + 26 * math.sin(math.radians(-90 + 60 * k))) for k in range(6)]
    a, b = pts[i % 6], pts[(i + 1) % 6]
    out = f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
    out += f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
    if dot:
        out += f'<circle cx="40" cy="40" r="5" fill="{INK}"/>'
    return out
add_nvr("Sequences", "Two rules", "sequence", "Which figure comes next in the sequence?",
        frame_strip([hexside(i, i % 2 == 0) for i in range(4)]),
        opt(hexside(4, True)), [opt(hexside(4, False)), opt(hexside(3, True)), opt(hexside(5, True)), opt(hexside(2, False))],
        "The thick side moves one side clockwise each time, and the centre dot appears in every other figure. Figure 5 has the 5th side thick and a dot.")

# =========================================================================
# Checks (mirror the rules in migration 050 and the approval step)
# =========================================================================
count = {s: sum(q["subject"] == s for q in questions) for s in ("ENGLISH", "MATHS", "VERBAL", "NON_VERBAL")}
assert 15 <= count["ENGLISH"] <= 20, count
assert count["MATHS"] == count["VERBAL"] == count["NON_VERBAL"] == 20, count
BAD = re.compile(r"<script|<foreignObject|<use\b|<animate|<set\b|javascript:|\bon[a-z]+\s*=", re.I)
ALLOWED = re.compile(r"^(svg|g|path|rect|circle|ellipse|line|polyline|polygon|text|tspan|defs|marker|title|desc)$", re.I)
for q in questions:
    blob = (q["stemFigure"] or "") + "".join(q[f"option{l}"] or "" for l in LET)
    assert not BAD.search(blob), q["quest"]
    for tag in re.findall(r"</?([a-zA-Z][\w:-]*)", blob):
        assert ALLOWED.match(tag), (tag, q["quest"])
    assert q["correctAnswer"] in LET
words = len(STORY.split())
assert 650 <= words <= 900, words

paper = {
    "paper": {"name": "Mock Test 1", "stage": "Challenger", "programmeCode": "GRAMMAR"},
    "setNo": 1,
    "sections": [
        {"subject": "ENGLISH", "sectionOrder": 1, "durationMinutes": 15},
        {"subject": "MATHS", "sectionOrder": 2, "durationMinutes": 15},
        {"subject": "VERBAL", "sectionOrder": 3, "durationMinutes": 10},
        {"subject": "NON_VERBAL", "sectionOrder": 4, "durationMinutes": 10},
    ],
    "comp": {"label": TITLE, "compStory": STORY},
    "questions": questions,
}
(OUT_DIR / "mock-test-1-set-1.json").write_text(json.dumps(paper, ensure_ascii=False, indent=2), encoding="utf-8")

# =========================================================================
# Preview for review (answers highlighted)
# =========================================================================
import html as H
NAMES = {"ENGLISH": "English", "MATHS": "Maths", "VERBAL": "Verbal Reasoning", "NON_VERBAL": "Non-Verbal Reasoning"}
parts = [f"<h1>Mock Test 1 · Set 1 · Challenger</h1><p class=meta>English {count['ENGLISH']} · Maths 20 · Verbal 20 · Non-Verbal 20 · "
         f"passage {words} words · answer key highlighted</p>"]
current = None
for q in questions:
    if q["subject"] != current:
        current = q["subject"]
        parts.append(f"<h2>{NAMES[current]}</h2>")
        if current == "ENGLISH":
            parts.append(f"<article><h3>{H.escape(TITLE)}</h3>" + "".join(f"<p>{H.escape(p)}</p>" for p in STORY.split("\n\n")) + "</article>")
    opts = []
    for l in LET:
        v = q[f"option{l}"]
        body = v if q["optionFormat"] == "svg" else H.escape(v)
        opts.append(f'<li class="{"ok" if l == q["correctAnswer"] else ""}"><b>{l}</b> {body}</li>')
    parts.append(f'<section><p class=q><b>{q["questionOrder"]}.</b> {H.escape(q["quest"]).replace(chr(10), "<br>")}'
                 f' <span class=tag>{H.escape(q["typeOfQuestion"])}</span></p>'
                 + (f'<div class=stem>{q["stemFigure"]}</div>' if q["stemFigure"] else "")
                 + f'<ol class="opts {q["optionFormat"]}">{"".join(opts)}</ol><p class=ex>Answer {q["correctAnswer"]}: {H.escape(q["explanation"])}</p></section>')
css = """body{font-family:system-ui,sans-serif;max-width:960px;margin:24px auto;padding:0 16px;color:#1f2937;background:#f8fafc}
h2{margin-top:36px;border-bottom:2px solid #0e7490;padding-bottom:4px}article{background:#fff;padding:16px 20px;border-radius:10px;line-height:1.6}
section{background:#fff;border-radius:10px;padding:12px 16px;margin:12px 0}.q{margin:0 0 8px}.tag{font-size:12px;color:#0e7490;background:#ecfeff;border-radius:99px;padding:1px 8px}
.stem{margin:8px 0;overflow-x:auto}.opts{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}.opts li{border:1px solid #cbd5e1;border-radius:8px;padding:6px 10px;display:flex;align-items:center;gap:8px}
.opts.text li{flex-basis:100%}.opts li.ok{border:2px solid #15803d;background:#f0fdf4}.ex{font-size:13px;color:#475569;margin:6px 0 0}.meta{color:#475569}"""
(OUT_DIR / "mock-test-1-set-1-preview.html").write_text(
    f"<!doctype html><meta charset=utf-8><title>Mock Test 1 Set 1</title><style>{css}</style>" + "".join(parts), encoding="utf-8")

dist = {l: sum(q["correctAnswer"] == l for q in questions) for l in LET}
print("questions", count, "passage words", words, "answer spread", dist)
