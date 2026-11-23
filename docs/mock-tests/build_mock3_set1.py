"""Builds Mock Test 3, Set 1 (Challenger): original content only.

Copyright: every passage, question, number and figure in this file was written
for this project. No text is taken or adapted from published 11+ papers,
books or websites; question TYPES (codes, series, analogies, nets...) are
common to all reasoning tests, but each item here is new. Nothing is reused
from Mock Tests 1 or 2.

Maths and Verbal answers are recomputed and asserted; Non-Verbal figures are
drawn from their rules (cube views are checked by folding the net in code).

Usage:  python -I docs/mock-tests/build_mock3_set1.py docs/mock-tests
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fractions import Fraction
from itertools import permutations
from mock_lib import (MockSet, INK, GREY, WHITE, LET, BOX, SIDES, svg, opt, shape, dots, arrow, tf, HFLIP, VFLIP,
                      frame_strip, analogy, matrix, code_stem, hmirror_stem)
from mock2_lib import small_arrow, unfolded, fold_stem, rot, LIGHT
from mock3_lib import (cube_dirs, valid_view, net_sym, cube3d, outline, lines, place, mirror_pts, turn_pts,
                       diag_unfold, diag_steps, inside_left_triangle, strip_gap, row_of)

S = MockSet(seed=20261124)
add = S.add

# =========================================================================
# ENGLISH - original story
# =========================================================================
TITLE = "The Triangle"
STORY = """In the school orchestra, Ravi played the triangle. He had not chosen it. Nobody chooses the triangle. It had been handed to him in Year Four by Mrs Pell, the music teacher, along with a small metal beater and the words, "Every orchestra needs one," which Ravi had since come to suspect was the sort of thing adults said about jobs nobody wanted.

The triangle has, at most, a handful of notes in any piece. In the spring concert piece, a long and rather stormy work called "Harbour Lights", Ravi had exactly four. He spent the remaining nine minutes counting. He counted bars the way other people counted sheep, except that if he fell asleep, everyone would know.

"You're lucky," said Maddie, who played first violin and had notes in every single bar. "You can't play a wrong note."

"I can play a right note at the wrong time," said Ravi. "That's worse. Everyone hears it."

Maddie considered this and, to her credit, did not laugh.

Three days before the concert, Mrs Pell lost her voice. It went on Monday morning with a sound like a door creaking shut, and by lunchtime she could manage only a whisper and a great many hand signals. On Tuesday she did not come in at all. On Wednesday, the day of the dress rehearsal, the head teacher appeared in the music room looking as though she had been asked to land an aeroplane.

"Mrs Pell is very sorry," she said. "She's hoping to be back tomorrow for the concert. In the meantime, she asks that one of you leads the rehearsal." She looked down at a note in her hand, clearly written in a hurry. "She says: Ravi."

Thirty heads turned. Ravi felt his face grow hot, as if someone had opened an oven door in front of it.

"Me? I play the triangle."

The head teacher checked the note again. "She says, and I quote, 'Ravi has counted every bar of this piece. He knows where everyone comes in.'"

It was true. That was the strange part. In nine minutes of counting, Ravi had done nothing else but listen. He knew that the cellos always came in a fraction late after the quiet section, because they were waiting for the flutes, who were waiting for them. He knew that the brass played too loudly in the storm, so that the violins had to scrape to be heard. He knew exactly where the music fell apart, because he had spent months sitting inside the moment just before it did.

He stood up. His legs did not feel entirely like his own.

The first run-through was a disaster. He waved his arms; nobody watched them. The cellos were late. The brass were deafening. When it ended, there was a long and painful silence, broken only by a trumpet player sniggering into his sleeve.

Ravi looked at the floor. Then, because there was nothing else to do, he looked at the cellos.

"You're waiting for the flutes after the quiet bit," he said. "Don't. Come in on my hand." He turned to the flutes. "And you're waiting for them. So nobody goes. Watch me instead." He turned, more bravely now, to the brass. "In the storm, you're drowning everyone else. It's supposed to sound like the wind. Not like a lorry."

Someone laughed, but it was a different kind of laugh this time.

The second run-through was better. The third was good. By the fourth, the cellos came in exactly on his hand, and the storm sounded like weather rather than traffic, and the violins rose over the top of it, clear and bright. When the last chord faded, the room was quiet in a way that felt nothing like the silence before.

"Ravi," said Maddie slowly. "You've missed all your triangle notes."

He had. Every one.

Mrs Pell's voice returned on Thursday, just about. She conducted the concert in a scarf, whispering instructions that only the front row could hear, but it hardly mattered: everyone knew the piece now. Ravi stood at the back with his small metal beater and played his four notes, each one exactly on time.

Afterwards, Mrs Pell found him packing away.

"Every orchestra needs one," she croaked, and nodded at the triangle.

This time, Ravi thought he understood what she meant. It had never really been about the triangle at all. It was about having somebody who was listening to everyone else."""

E = "ENGLISH"
def eng(qtype, quest, answer, distractors, explanation):
    add(E, "Comprehension", None, qtype, quest, answer, distractors, explanation)

eng("inference", "What did Ravi suspect about the words \"Every orchestra needs one\"?",
    "That adults say it to make an unpopular job sound important",
    ["That Mrs Pell was joking", "That the orchestra was short of players",
     "That the triangle was the hardest instrument", "That Mrs Pell wanted him to give up music"],
    "He thought it was 'the sort of thing adults said about jobs nobody wanted'.")
eng("retrieval", "How many notes did Ravi have to play in \"Harbour Lights\"?",
    "Four", ["Nine", "None", "One in every bar", "Thirty"], "'In the spring concert piece... Ravi had exactly four.'")
eng("language effects", "\"He counted bars the way other people counted sheep, except that if he fell asleep, everyone would know.\" What does this sentence suggest?",
    "Counting was dull, but he had to stay alert because a mistake would be obvious",
    ["Ravi often fell asleep during concerts", "Ravi found counting exciting and relaxing",
     "The orchestra was playing a piece about sheep", "Ravi could not count very well"],
    "Counting sheep is boring and sends you to sleep; unlike that, Ravi could not afford to drift off.")
eng("multi-step reasoning", "Why does Ravi say playing \"a right note at the wrong time\" is worse than a wrong note?",
    "Because a triangle note stands out, so a badly timed one is heard by everyone",
    ["Because the triangle only has one note", "Because Mrs Pell would be angry",
     "Because wrong notes are not allowed in concerts", "Because Maddie would laugh at him"],
    "'Everyone hears it': with so few notes, any mistake in timing is very noticeable.")
eng("language effects", "Mrs Pell's voice went \"with a sound like a door creaking shut\". What does this simile suggest?",
    "Her voice faded away slowly and croakily until it stopped",
    ["She slammed the door of the music room", "She was shouting very loudly",
     "Her voice suddenly became very high", "She had hurt her throat on a door"],
    "A creaking door closes slowly with a rough sound, like her voice failing.")
eng("language effects", "The head teacher looked \"as though she had been asked to land an aeroplane\". What does this suggest?",
    "She felt out of her depth in charge of the orchestra",
    ["She had recently been on an aeroplane", "She was excited about the concert",
     "She wanted to leave the school", "She was annoyed with Mrs Pell"],
    "Landing a plane is a task most people could not do; she feels unqualified and anxious.")
eng("retrieval", "Why did Mrs Pell choose Ravi to lead the rehearsal?",
    "He had counted every bar and knew where everyone came in",
    ["He was the oldest member of the orchestra", "He had the fewest notes to play",
     "He had asked to be the conductor", "Maddie was ill"],
    "The note says he 'has counted every bar of this piece. He knows where everyone comes in.'")
eng("inference", "\"That was the strange part.\" What did Ravi find strange?",
    "That by playing so little he had come to know the whole piece extremely well",
    ["That Mrs Pell had written him a note", "That the head teacher knew his name",
     "That the triangle was in the concert at all", "That Maddie did not laugh"],
    "His boring job of counting had made him listen to everything, which gave him an unexpected skill.")
eng("multi-step reasoning", "Why did the cellos and the flutes both come in late?",
    "Each group was waiting for the other to start first",
    ["They could not see Mrs Pell", "Their music was missing some pages",
     "They were too busy talking", "The brass were playing too loudly"],
    "The cellos 'were waiting for the flutes, who were waiting for them'.")
eng("language effects", "\"His legs did not feel entirely like his own.\" What does this show about Ravi?",
    "He was so nervous that his body felt strange and unsteady",
    ["He had hurt his legs", "He had been sitting down for too long",
     "He was wearing someone else's trousers", "He was very confident"],
    "Nerves make his legs feel shaky, as if they belonged to someone else.")
eng("inference", "Why did Ravi look at the cellos after the first run-through?",
    "He decided to tackle the problems he had noticed, one group at a time",
    ["He wanted to see who was laughing", "He was too embarrassed to look at the brass",
     "He was waiting for the cellos to apologise", "He had forgotten what to do"],
    "'Because there was nothing else to do', he starts using what he knows, beginning with the late cellos.")
eng("language effects", "\"It's supposed to sound like the wind. Not like a lorry.\" What is Ravi telling the brass players?",
    "They are playing far too heavily and loudly for the music",
    ["They should play more quickly", "They should stop playing altogether",
     "They should practise outside", "They are playing the wrong piece"],
    "Wind is a sweeping sound; a lorry is heavy and noisy, so they are overpowering the others.")
eng("inference", "\"Someone laughed, but it was a different kind of laugh this time.\" How had the laugh changed?",
    "It was friendly and approving, not mocking", ["It was louder than before", "It came from Mrs Pell",
     "It was nervous and frightened", "It was meant to upset Ravi"],
    "The first was a snigger at Ravi; this one shows the orchestra enjoying his joke and accepting him.")
eng("structure", "How does the writer show the rehearsals improving?",
    "By describing each run-through as better than the last, ending with the music sounding right",
    ["By listing the names of all the players", "By describing what Ravi ate for lunch",
     "By having Mrs Pell return during the rehearsal", "By showing the head teacher conducting"],
    "'The second run-through was better. The third was good. By the fourth...' builds steady improvement.")
eng("inference", "Maddie says, \"You've missed all your triangle notes.\" What does this show?",
    "Ravi had been so busy leading that he forgot his own part",
    ["Ravi had lost his beater", "Ravi did not want to play the triangle any more",
     "Maddie was angry with Ravi", "The triangle had been left at home"],
    "Conducting took all his attention, a gently funny twist after his worries about timing.")
eng("vocabulary", "Mrs Pell \"croaked\" her words after the concert. What does \"croaked\" tell us?",
    "She spoke in a rough, hoarse voice", ["She spoke very loudly", "She sang her words",
     "She spoke angrily", "She spoke in a cheerful voice"], "Her voice had only 'just about' returned, so it was hoarse.")
eng("character", "Which word best describes how Ravi changes during the story?",
    "From unsure of his worth to confident in his skill",
    ["From cheerful to angry", "From hard-working to lazy", "From popular to lonely", "From confident to frightened"],
    "He begins thinking his role is pointless and ends understanding the value of listening.")
eng("author's purpose", "What is the main message of the story?",
    "A role that seems small can matter a great deal, especially if you pay attention",
    ["The triangle is the most important instrument", "Teachers should never lose their voices",
     "Only the loudest players are important", "Concerts are always a disaster without practice"],
    "Ravi's 'unwanted' job made him the one person who was 'listening to everyone else'.")

# =========================================================================
# MATHS
# =========================================================================
M = "MATHS"
assert 3006 - 1748 == 1258
add(M, "Number", "Subtraction", "calculation", "What is 3,006 − 1,748?",
    "1,258", ["1,358", "2,742", "1,268", "1,342"], "3,006 − 1,748 = 1,258. Check: 1,258 + 1,748 = 3,006.")
assert 59 * 46 == 2714
add(M, "Number", "Long multiplication", "calculation", "What is 59 × 46?",
    "2,714", ["2,614", "2,754", "2,374", "2,704"], "59 × 46 = 60 × 46 − 46 = 2,760 − 46 = 2,714.")
assert Fraction(7, 12) + Fraction(5, 8) == Fraction(29, 24)
add(M, "Fractions", "Adding fractions", "calculation", "What is 7/12 + 5/8?",
    "1 5/24", ["12/20", "1 1/24", "1 7/24", "35/96"], "14/24 + 15/24 = 29/24 = 1 5/24.")
assert Fraction(5, 8) * 96 == 60
add(M, "Fractions", "Fraction of an amount", "word problem", "A club has 96 members and 5/8 of them are girls. How many girls are there?",
    "60", ["36", "40", "12", "48"], "96 ÷ 8 = 12; 12 × 5 = 60.")
assert Fraction(120 * 115, 100) == 138
add(M, "Percentages", "Percentage increase", "word problem", "A bike costs £120. Its price goes up by 15%. What is the new price?",
    "£138", ["£135", "£18", "£102", "£140"], "15% of £120 is £18; £120 + £18 = £138.")
assert 400 * Fraction(3, 8) == 150
add(M, "Ratio", "Recipe ratio", "word problem", "Orange squash is mixed with water in the ratio 3 : 5. How much squash is needed to make 400 ml of drink?",
    "150 ml", ["240 ml", "120 ml", "250 ml", "80 ml"], "There are 8 parts, so one part is 50 ml. Squash is 3 parts: 150 ml.")
x = 7; assert 6 * x + 5 == 2 * x + 33
add(M, "Algebra", "Equations", "calculation", "Solve 6x + 5 = 2x + 33.",
    "x = 7", ["x = 4.75", "x = 8", "x = 28", "x = 9.5"], "Subtract 2x: 4x + 5 = 33, so 4x = 28 and x = 7.")
seq = [50 - 6 * k for k in range(5)]; assert seq == [50, 44, 38, 32, 26] and 50 - 6 * 11 == -16
add(M, "Algebra", "Sequences", "pattern", "The sequence 50, 44, 38, 32, … continues. What is the 12th term?",
    "−16", ["−22", "−10", "16", "−6"], "It goes down by 6 each time. The 12th term is 50 − 11 × 6 = −16.")
marks = [14, 18, 11, 18, 20, 15]; assert sum(marks) == 96 and 96 / 6 == 16
add(M, "Statistics", "Mean", "multi-step", "The mean of six test scores is 16. Five of the scores are 14, 18, 11, 18 and 20. What is the sixth score?",
    "15", ["16", "13", "17", "96"], "Six scores with mean 16 total 96. 14 + 18 + 11 + 18 + 20 = 81, so the sixth is 96 − 81 = 15.")
TRAP = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 150" width="300" height="205">'
        '<polygon points="40,120 190,120 150,30 70,30" fill="#e0f2fe" stroke="#1f2937" stroke-width="2"/>'
        '<text x="50" y="114" font-size="12" fill="#1f2937">40°</text>'
        '<text x="82" y="48" font-size="12" fill="#1f2937">140°</text>'
        '<text x="140" y="48" font-size="13" font-weight="bold" fill="#1f2937">y</text>'
        '<text x="168" y="114" font-size="12" fill="#1f2937">50°</text>'
        '<text x="110" y="144" font-size="9" text-anchor="middle" fill="#6b7280">Not drawn to scale</text></svg>')
assert 360 - 140 - 50 - 40 == 130
add(M, "Shape", "Angles in a quadrilateral", "diagram",
    "Find the angle marked y in this quadrilateral.",
    "130°", ["140°", "90°", "50°", "230°"], "Angles in a quadrilateral add up to 360°: 360 − 140 − 50 − 40 = 130°.", stem=TRAP)
assert 12 * 8 - 4 * 3 == 84
add(M, "Shape", "Area", "multi-step",
    "A rectangular lawn is 12 m by 8 m. A rectangular flower bed 4 m by 3 m is cut out of it. What area of lawn is left?",
    "84 m²", ["96 m²", "12 m²", "108 m²", "80 m²"], "12 × 8 = 96 m² and 4 × 3 = 12 m²; 96 − 12 = 84 m².")
assert 5 * 5 * 5 == 125
add(M, "Shape", "Volume of a cube", "calculation", "A cube has edges of 5 cm. What is its volume?",
    "125 cm³", ["25 cm³", "15 cm³", "150 cm³", "75 cm³"], "5 × 5 × 5 = 125 cm³.")
assert (14 * 60 + 35) - (9 * 60 + 50) == 4 * 60 + 45
add(M, "Measures", "Time", "word problem", "A shop opens at 09:50 and closes at 14:35. How long is it open?",
    "4 hours 45 minutes", ["5 hours 45 minutes", "4 hours 15 minutes", "5 hours 15 minutes", "4 hours 85 minutes"],
    "09:50 to 13:50 is 4 hours; 13:50 to 14:35 is 45 minutes.")
assert sorted([d for d in range(1, 49) if 48 % d == 0 and 36 % d == 0])[-1] == 12
add(M, "Number", "Highest common factor", "reasoning", "What is the highest common factor of 36 and 48?",
    "12", ["6", "4", "144", "24"], "Factors of 36 include 12 and 18; factors of 48 include 12 and 16. The largest number in both lists is 12.")
assert Fraction(9, 20) == Fraction(45, 100)
add(M, "Fractions", "Fractions, decimals, percentages", "reasoning", "Which of these is the same as 9/20?",
    "45%", ["0.9", "9.2%", "20%", "0.29"], "9/20 = 45/100 = 45%.")
add(M, "Number", "Rounding", "reasoning", "What is 7.465 rounded to 1 decimal place?",
    "7.5", ["7.4", "7.47", "7.0", "8.0"], "The hundredths digit is 6, so round the tenths up: 7.465 → 7.5.")
green, total = 6, 15; assert Fraction(total - green, total) == Fraction(3, 5)
add(M, "Statistics", "Probability", "reasoning",
    "A spinner has 15 equal sections and 6 of them are green. What is the probability of NOT landing on green?",
    "3/5", ["2/5", "6/15", "9/6", "1/6"], "15 − 6 = 9 sections are not green: 9/15 = 3/5.")
s = 14; assert s + (s + 6) + 2 * s == 62
add(M, "Algebra", "Forming equations", "multi-step",
    "Three children have 62 stickers altogether. Jay has 6 more than Kim, and Lou has twice as many as Kim. How many does Kim have?",
    "14", ["20", "28", "12", "16"], "Kim k, Jay k + 6, Lou 2k: 4k + 6 = 62, so 4k = 56 and k = 14.")
assert 3 * 240 + 2 * 185 == 1090 and 2000 - 1090 == 910
add(M, "Number", "Money", "multi-step",
    "Ben buys 3 drinks at £2.40 each and 2 sandwiches at £1.85 each. He pays with a £20 note. How much change does he get?",
    "£9.10", ["£10.90", "£8.10", "£9.90", "£11.10"], "3 × £2.40 = £7.20 and 2 × £1.85 = £3.70; total £10.90. £20 − £10.90 = £9.10.")
assert 120 * Fraction(3, 2) == 180
add(M, "Measures", "Speed", "word problem", "A train travels at 120 km/h for 1 hour 30 minutes. How far does it go?",
    "180 km", ["150 km", "120 km", "240 km", "80 km"], "1 h 30 min = 1.5 h; 120 × 1.5 = 180 km.")

# =========================================================================
# VERBAL REASONING
# =========================================================================
V = "VERBAL"
A = ord("A")
VOW = set("AEIOU")
def vc(word):
    """Vowels move forward 1, consonants move back 1."""
    return "".join(chr((ord(c) - A + (1 if c in VOW else -1)) % 26 + A) for c in word)

assert vc("BEAD") == "AFBC"
ans = vc("TOAST"); assert ans == "SPBRS"
add(V, "Codes", "Vowels and consonants", "letter code",
    "In a code, BEAD is written as AFBC. How would TOAST be written in the same code?",
    ans, ["UPBTU", "SNZRS", "UNZTU", "SPBRT"],
    "Vowels move forward one letter and consonants move back one: T→S, O→P, A→B, S→R, T→S.")
rev1 = lambda w: "".join(chr((ord(c) - A + 1) % 26 + A) for c in w[::-1])
assert rev1("LION") == "OPJM"
ans = rev1("BEAR"); assert ans == "SBFC"
add(V, "Codes", "Two-step code", "letter code",
    "In a code, LION is written as OPJM. How would BEAR be written in the same code?",
    ans, ["CFBS", "SBFD", "RAEB", "QZDA"],
    "The word is written backwards and then each letter moves forward one: BEAR → RAEB → SBFC.")
s = ["A"]; [s.append(chr(ord(s[-1]) + g)) for g in (1, 3, 5, 7, 9)]; assert s == ["A", "B", "E", "J", "Q", "Z"]
add(V, "Series", "Letter series", "letter series", "Find the next letter: A, B, E, J, Q, ?",
    "Z", ["Y", "X", "V", "W"], "The gaps are 1, 3, 5, 7, so the next gap is 9: Q → Z.")
s = [1, 3]; [s.append(s[-1] + s[-2]) for _ in range(5)]; assert s[:6] == [1, 3, 4, 7, 11, 18] and s[6] == 29
add(V, "Series", "Number series", "number series", "Find the next number: 1, 3, 4, 7, 11, 18, ?",
    "29", ["25", "26", "28", "36"], "Each number is the sum of the two before it: 11 + 18 = 29.")
s = [3]; [s.append(s[-1] * 2 if i % 2 == 0 else s[-1] - 2) for i in range(6)]; assert s == [3, 6, 4, 8, 6, 12, 10]
add(V, "Series", "Number series", "number series", "Find the next number: 3, 6, 4, 8, 6, 12, ?",
    "10", ["24", "14", "9", "8"], "The steps take turns: × 2, then − 2. 12 − 2 = 10.")
assert 5 * 5 - 3 == 22 and 4 * 4 - 7 == 9 and 6 * 6 - 10 == 26
add(V, "Number", "Related numbers", "missing number",
    "The numbers in each group are related in the same way. Find the missing number.\n5 (22) 3     4 (9) 7     6 ( ? ) 10",
    "26", ["46", "16", "60", "36"], "Square the first number and take away the second: 25 − 3 = 22, 16 − 7 = 9, 36 − 10 = 26.")
assert all(w in {"peak", "kite", "dark", "king"} for w in ("pea" + "k", "k" + "ite", "dar" + "k", "k" + "ing"))
add(V, "Word building", "Shared letter", "missing letter",
    "Which letter ends the first word and starts the second word in BOTH pairs?\npea ( ? ) ite        dar ( ? ) ing",
    "k", ["r", "t", "l", "n"], "peak, kite and dark, king. R makes pear and rite, but not a word ending dar-r.")
assert "CAP" + "TAIN" == "CAPTAIN"
add(V, "Word building", "Missing three letters", "missing word",
    "Three letters that make a word have been taken out of the word in capitals. Which three letters complete it?\nThe TAIN steered the ship safely into the harbour.",
    "CAP", ["TOP", "MAN", "BAR", "PEN"], "CAP + TAIN = CAPTAIN.")
for w in ("ball", "fall", "flake"):
    assert "snow" + w in {"snowball", "snowfall", "snowflake"}
add(V, "Word building", "Compound words", "compound word",
    "Which word can go in front of all of these to make three new words?  ___ball   ___fall   ___flake",
    "snow", ["rain", "foot", "water", "night"], "snowball, snowfall, snowflake. Rain, foot, water and night each fail with at least one.")
add(V, "Vocabulary", "Antonyms", "antonym", "Which word is most nearly the OPPOSITE of RELUCTANT?",
    "eager", ["unwilling", "slow", "careful", "tired"], "Reluctant means unwilling; the opposite is eager.")
add(V, "Vocabulary", "Synonyms", "synonym", "Which word is closest in meaning to METICULOUS?",
    "thorough", ["quick", "messy", "generous", "noisy"], "Meticulous means paying great attention to detail: thorough.")
add(V, "Vocabulary", "Classification", "classification", "Which word belongs with: oak, ash, elm?",
    "birch", ["rose", "fern", "acorn", "leaf"], "Oak, ash and elm are trees; so is birch. An acorn and a leaf are parts of a tree.")
pets = ["dog", "cat", "fish"]
sols = [p for p in permutations(pets)  # Ali, Bea, Cy
        if p[0] == "fish" and p[1] != "fish" and p[2] != "cat"]
assert len(sols) == 1 and sols[0][2] == "dog"
add(V, "Logic", "Who has what", "logic",
    "Ali, Bea and Cy each have one pet: a dog, a cat or a fish. Ali is allergic to fur. Bea's pet does not live in water. Cy does not have a cat. Who has the dog?",
    "Cy", ["Ali", "Bea", "Nobody", "It cannot be worked out"], "Ali cannot have fur, so Ali has the fish. Cy has no cat, so Cy has the dog and Bea has the cat.")
days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
assert days[(0 + 26 - 3) % 7] == "Wednesday"
add(V, "Logic", "Calendar", "logic", "The 3rd of a month is a Monday. What day of the week is the 26th of the same month?",
    "Wednesday", ["Monday", "Tuesday", "Thursday", "Friday"], "The 26th is 23 days after the 3rd. 23 = 3 weeks + 2 days, so it is two days after Monday: Wednesday.")
assert sorted("asleep") == sorted("palsee") == sorted("please")
add(V, "Word building", "Anagrams", "anagram",
    "Rearrange the letters in capitals to make a word that completes the sentence sensibly.\nThe cat curled up by the fire and fell PALSEE.",
    "asleep", ["please", "sleepy", "leaps", "lapse"], "PALSEE can make ASLEEP or PLEASE, but only 'fell asleep' makes sense.")
base = "TEMPERATURE"
def can_make(word, base):
    return all(word.upper().count(c) <= base.count(c) for c in set(word.upper()))
opts = ["parrot", "tamper", "rapture", "temper", "mature"]
assert [w for w in opts if not can_make(w, base)] == ["parrot"]
add(V, "Word building", "Letters from a word", "word making",
    "Which word can NOT be made using only the letters of TEMPERATURE? (Each letter may be used only as many times as it appears.)",
    "parrot", ["tamper", "rapture", "temper", "mature"], "TEMPERATURE has no O, so PARROT cannot be made.")
add(V, "Vocabulary", "Analogies", "analogy", "Bird is to flock as wolf is to ?",
    "pack", ["den", "howl", "cub", "herd"], "A group of birds is a flock; a group of wolves is a pack.")
diff = lambda a, b: sum(x != y for x, y in zip(a, b))
opts = ["LINE", "PILE", "PINT", "LAME", "PANT"]
assert [w for w in opts if diff("PINE", w) == 1 and diff(w, "LANE") == 1] == ["LINE"]
add(V, "Word building", "Word ladders", "word ladder",
    "Change one letter at a time to turn PINE into LANE. Which word could go in the middle?\nPINE → ? → LANE",
    "LINE", ["PILE", "PINT", "LAME", "PANT"], "PINE → LINE (P to L) → LANE (I to A). The others need more than one change at a step.")
f = lambda n: n * n - 1; assert f(6) == 35 and f(9) == 80 and f(4) == 15
add(V, "Number", "Number pairs", "missing number",
    "Find the number that completes the third pair in the same way as the first two.\n(6 → 35)   (9 → 80)   (4 → ?)",
    "15", ["16", "12", "9", "20"], "Square the number and take away 1: 36 − 1 = 35, 81 − 1 = 80, 16 − 1 = 15.")
add(V, "Logic", "Seating", "logic",
    "Ana, Ben, Cat and Dan sit around a square table, one on each side, facing the middle. Ana sits opposite Ben. Cat sits on Ana's left. Who sits on Ben's left?",
    "Dan", ["Cat", "Ana", "Nobody", "It cannot be worked out"],
    "Facing the middle, Ana's left is Ben's right. Cat is on Ana's left, so Cat is on Ben's right, leaving Dan on Ben's left.")

# =========================================================================
# NON-VERBAL REASONING
# =========================================================================
N = "NON_VERBAL"
def nvr(topic, sub, qtype, quest, stem, answer, distractors, explanation, option_format="svg"):
    add(N, topic, sub, qtype, quest, answer, distractors, explanation, stem=stem, option_format=option_format)

SEQ_Q = "Which figure comes next in the sequence?"
ODD_Q = "Which figure is the odd one out?"
AN_Q = "The first figure changes into the second. Which option changes in the same way from the third figure?"

# 1 Lines: one more each time, alternating across and down; a dot moves anticlockwise round the corners
CORNERS_ACW = [(20, 20), (20, 60), (60, 60), (60, 20)]
def stripes(n, horizontal, corner):
    gap = 44 / (n + 1)
    if horizontal:
        ls = [(22, 18 + gap * (i + 1), 58, 18 + gap * (i + 1)) for i in range(n)]
    else:
        ls = [(18 + gap * (i + 1), 22, 18 + gap * (i + 1), 58) for i in range(n)]
    cx, cy = CORNERS_ACW[corner % 4]
    return (shape("square", r=40) + lines([(round(a, 1), round(b, 1), round(c, 1), round(d, 1)) for a, b, c, d in ls])
            + f'<circle cx="{cx}" cy="{cy}" r="4" fill="{INK}"/>')
fr = [(k + 1, k % 2 == 0, k) for k in range(5)]
nvr("Sequences", "Three rules", "sequence", SEQ_Q, frame_strip([stripes(*f) for f in fr[:4]]),
    opt(stripes(5, True, 4)), [opt(stripes(5, False, 4)), opt(stripes(4, True, 4)), opt(stripes(5, True, 3)), opt(stripes(5, True, 1))],
    "The number of lines goes up by one, the lines alternate across and down, and the dot moves one corner anticlockwise. Next: 5 lines across, dot back at the top left.")
# 2 Three shapes shuffle left one place; the middle one is always black
ORDER = ["circle", "square", "triangle"]
def trio(shift, black_pos=1):
    ks = ORDER[shift % 3:] + ORDER[:shift % 3]
    return "".join(shape(k, fill=INK if i == black_pos else WHITE, cx=x, cy=40, r=10) for i, (k, x) in enumerate(zip(ks, (17, 40, 63))))
nvr("Sequences", "Moving order", "sequence", SEQ_Q, frame_strip([trio(k) for k in range(4)]),
    opt(trio(4)), [opt(trio(4, 0)), opt(trio(3)), opt(trio(5)), opt(trio(4, 2))],
    "Each time the shapes move one place to the left and the first one goes to the end. Whichever shape is in the middle is black.")
# 3 Missing middle: one side fewer, two more dots
kinds = ["octagon", "heptagon", "hexagon", "pentagon", "square"]
cells = [shape(k, r=30) + dots(2 * i + 1, r=2.6, gap=7.5, cols=3) for i, k in enumerate(kinds)]
nvr("Sequences", "Missing middle", "sequence", "Which figure is missing from the middle of the sequence?",
    strip_gap(cells, 2), opt(cells[2]),
    [opt(shape("hexagon", r=30) + dots(4, r=2.6, gap=7.5, cols=3)), opt(shape("pentagon", r=30) + dots(5, r=2.6, gap=7.5, cols=3)),
     opt(shape("hexagon", r=30) + dots(6, r=2.6, gap=7.5, cols=3)), opt(shape("heptagon", r=30) + dots(5, r=2.6, gap=7.5, cols=3))],
    "Each figure has one side fewer and two more dots than the one before: 8 sides 1 dot, 7 sides 3 dots, so the middle is 6 sides with 5 dots.")
# 4 Arrow moves round the edge three places at a time, always pointing at the centre
EDGE = [(40, 14), (63, 17), (66, 40), (63, 63), (40, 66), (17, 63), (14, 40), (17, 17)]
def edge_arrow(p, inward=True):
    x, y = EDGE[p % 8]
    a = math.degrees(math.atan2(40 - x, -(40 - y))) % 360
    if not inward:
        a = (a + 180) % 360
    return shape("square", r=40, fill=WHITE) + small_arrow(x, y, round(a), s=0.42)
nvr("Sequences", "Position and direction", "sequence", SEQ_Q, frame_strip([edge_arrow(3 * k) for k in range(4)]),
    opt(edge_arrow(12)), [opt(edge_arrow(12, inward=False)), opt(edge_arrow(11)), opt(edge_arrow(13)), opt(edge_arrow(8))],
    "The arrow moves three places clockwise round the edge each time and always points at the centre. Next it is at the bottom middle, pointing up.")
# 5 Odd one out: the two lines are parallel
def pair_lines(a, b, gap=12):
    out = ""
    for ang, off in ((a, -gap), (b, gap)):
        out += f'<line x1="40" y1="16" x2="40" y2="64" stroke="{INK}" stroke-width="3" transform="rotate({ang} 40 40) translate({off},0)"/>'
    return out
nvr("Odd one out", "Parallel lines", "odd one out", ODD_Q, None,
    opt(pair_lines(30, 55)), [opt(pair_lines(a, a)) for a in (0, 45, 90, 120)],
    "In four figures the two lines are parallel (they point the same way). In the odd one out they are not.")
# 6 Odd one out: dot in the quarter opposite the shaded quarter
QPOS = [(30, 30), (50, 30), (50, 50), (30, 50)]  # TL, TR, BR, BL
def quarters(shaded, dot_q):
    fills = [INK if i == shaded else WHITE for i in range(4)]
    out = shape("circle", r=28)
    paths = ["M40,40 L40,12 A28,28 0 0 0 12,40 Z", "M40,40 L68,40 A28,28 0 0 0 40,12 Z",
             "M40,40 L40,68 A28,28 0 0 0 68,40 Z", "M40,40 L12,40 A28,28 0 0 0 40,68 Z"]
    out += "".join(f'<path d="{d}" fill="{f}" stroke="{INK}" stroke-width="1.5"/>' for d, f in zip(paths, fills))
    x, y = QPOS[dot_q]
    return out + f'<circle cx="{x}" cy="{y}" r="4" fill="{GREY}" stroke="{INK}" stroke-width="1.5"/>'
nvr("Odd one out", "Position", "odd one out", ODD_Q, None,
    opt(quarters(2, 3)), [opt(quarters(q, (q + 2) % 4)) for q in (0, 1, 3, 2)],
    "In four figures the dot sits in the quarter opposite the black quarter. In the odd one out it is in a quarter next to it.")
# 7 Odd one out: seven dots altogether
def two_shapes(a, na, b, nb):
    return (shape(a, cx=22, cy=40, r=17) + dots(na, cx=22, cy=40, r=2.3, gap=6.5, cols=2)
            + shape(b, cx=58, cy=40, r=17) + dots(nb, cx=58, cy=40, r=2.3, gap=6.5, cols=2))
good = [("square", 3, "circle", 4), ("circle", 5, "square", 2), ("hexagon", 1, "circle", 6), ("square", 4, "hexagon", 3)]
assert all(na + nb == 7 for _, na, _, nb in good)
nvr("Odd one out", "Counting", "odd one out", ODD_Q, None,
    opt(two_shapes("circle", 4, "hexagon", 4)), [opt(two_shapes(*g)) for g in good],
    "In four figures there are 7 dots altogether. The odd one out has 8.")
# 8 Analogy: the shape becomes two small black copies
def big(kind, fill):
    return shape(kind, fill=fill, r=28)
def two_small(kind, fill=INK):
    return shape(kind, fill=fill, cx=25, cy=40, r=12) + shape(kind, fill=fill, cx=55, cy=40, r=12)
nvr("Analogies", "Splitting", "analogy", AN_Q,
    analogy(big("circle", WHITE), two_small("circle"), big("pentagon", GREY)),
    opt(two_small("pentagon")), [opt(two_small("pentagon", GREY)), opt(two_small("circle")), opt(shape("pentagon", fill=INK, r=12)),
                                 opt(two_small("pentagon") + shape("pentagon", fill=INK, cx=40, cy=64, r=8))],
    "The big shape is replaced by two small copies of it, and they are always black, whatever colour the big shape was.")
# 9 Analogy: reflect left to right AND swap the shading of the two parts
def two_part(big_kind, small_kind, big_fill, small_fill, mirror=False):
    inner = shape(big_kind, fill=big_fill, cx=44, cy=46, r=22) + shape(small_kind, fill=small_fill, cx=18, cy=16, r=9)
    return tf(inner, HFLIP) if mirror else inner
nvr("Analogies", "Two changes", "analogy", AN_Q,
    analogy(two_part("square", "circle", GREY, WHITE), two_part("square", "circle", WHITE, GREY, True),
            two_part("triangle", "square", INK, WHITE)),
    opt(two_part("triangle", "square", WHITE, INK, True)),
    [opt(two_part("triangle", "square", INK, WHITE, True)), opt(two_part("triangle", "square", WHITE, INK)),
     opt(two_part("triangle", "square", WHITE, GREY, True)), opt(two_part("triangle", "circle", WHITE, INK, True))],
    "Two things happen: the figure is reflected left to right, and the two parts swap colours.")
# 10 Matrix: dots in the third column = first + second
def sd(kind, n):
    return shape(kind, r=30) + dots(n, r=2.8, gap=8, cols=3)
grid = [("circle", 1, 2), ("square", 2, 2), ("hexagon", 3, 1)]
cells = [sd(k, n) for k, a, b in grid for n in (a, b, a + b)]
nvr("Matrices", "Adding", "matrix", "Which option completes the grid?", matrix(cells[:-1], 3),
    opt(sd("hexagon", 4)), [opt(sd("hexagon", 3)), opt(sd("hexagon", 5)), opt(sd("square", 4)), opt(sd("hexagon", 2))],
    "In each row the third figure has as many dots as the first two added together, and the shape stays the same. 3 + 1 = 4.")
# 11 Matrix 2 x 2: across = left-right mirror, down = top-bottom mirror
P = (f'<polygon points="16,64 16,18 40,18 40,34 28,34 28,64" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
     f'<circle cx="54" cy="56" r="7" fill="{INK}"/><rect x="48" y="16" width="14" height="10" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>')
nvr("Matrices", "Mirror grid", "matrix", "Which option completes the grid?", matrix([P, tf(P, HFLIP), tf(P, VFLIP)], 2),
    opt(rot(P, 180)), [opt(P), opt(tf(P, HFLIP)), opt(tf(P, VFLIP)), opt(rot(P, 90))],
    "Moving right reflects the figure left to right; moving down reflects it top to bottom. Doing both gives the same as a half turn.")
# 12 Reflection in a mirror line above the figure
F = (f'<polygon points="14,62 14,30 34,30 34,46 52,46 52,22 66,22 66,62" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
     f'<circle cx="24" cy="54" r="5" fill="{INK}"/><rect x="56" y="30" width="7" height="7" fill="{GREY}"/>')
above = svg(f'<line x1="4" y1="6" x2="86" y2="6" stroke="{INK}" stroke-width="2" stroke-dasharray="5,4"/>'
            f'<g transform="translate(5,10)">{F}</g>', 90, 100)
nvr("Reflection", "Mirror above", "reflection", "Which option shows the figure reflected in the dashed mirror line above it?",
    above, opt(tf(F, VFLIP)), [opt(F), opt(tf(F, HFLIP)), opt(rot(F, 180)), opt(rot(F, 90))],
    "A mirror line above the figure swaps top and bottom but keeps left and right. A half turn would also swap left and right.")
# 13 Rotation by 135° clockwise
G = (f'<polygon points="40,10 52,34 46,34 46,66 34,66 34,34 28,34" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
     f'<circle cx="58" cy="58" r="6" fill="{INK}"/>')
nvr("Rotation", "Three eighths of a turn", "rotation", "Which option shows the figure turned 135° clockwise?",
    frame_strip([G], question=False),
    opt(rot(G, 135)), [opt(rot(G, 45)), opt(rot(G, 225)), opt(rot(G, -135)), opt(tf(rot(G, 135), HFLIP))],
    "135° is one and a half right angles. The arrow, which pointed up, now points to the bottom right, and the dot moves from the bottom right round to the left side.")
# 14 Fold along both diagonals, punch, unfold
hq = [(20, 40), (16, 52)]
assert all(inside_left_triangle(p) for p in hq)
ans = diag_unfold(hq); assert len(ans) == 8
w1 = sorted(set(hq) | {(y, x) for x, y in hq})
w2 = sorted({(X, Y) for x, y in hq for X in (x, 80 - x) for Y in (y, 80 - y)})
w3 = sorted(set(ans) - {(52, 16)})
w4 = sorted((set(ans) - {(28, 64)}) | {(28, 16)})
assert (52, 16) in ans and len({tuple(ans), tuple(w1), tuple(w2), tuple(w3), tuple(w4)}) == 5
nvr("Folding", "Diagonal folds", "paper folding",
    "A square of paper is folded along one diagonal, then folded in half again as shown. Two holes are punched. What does the paper look like when it is unfolded?",
    fold_stem(diag_steps(hq)), opt(unfolded(ans)), [opt(unfolded(w)) for w in (w1, w2, w3, w4)],
    "Each fold line acts like a mirror. Unfolding the second fold reflects the holes in that line; unfolding the diagonal fold reflects all of them again, giving 8 holes.")
# 15 Which cube can be made from the net?
cells = {(0, 1): "circle", (1, 0): "cross", (1, 1): "black", (1, 2): "dot", (2, 1): "grey", (3, 1): "diamond"}
d = cube_dirs(cells)
right_view = ("black", "grey", "dot")
assert valid_view(d, *right_view)
wrong_views = [("black", "diamond", "dot"), ("circle", "black", "grey"), ("black", "dot", "grey"), ("cross", "dot", "grey")]
assert not any(valid_view(d, *v) for v in wrong_views)
nvr("Cubes", "Nets to cubes", "cube net", "Which cube could be made by folding this net?",
    net_sym(cells), opt(cube3d(*right_view)), [opt(cube3d(*v)) for v in wrong_views],
    "Faces that are opposite each other can never be seen together: black/diamond, circle/grey and cross/dot are opposite pairs. One other cube shows three possible faces, but in the mirror-image order.")
# 16 Codes: arrow direction + shading
DIR = {0: "F", 90: "G", 180: "H"}
SHADE = {INK: "W", WHITE: "X", GREY: "Y"}
ex = [(0, INK), (90, WHITE), (180, GREY), (90, INK)]
nvr("Codes", "Two-letter codes", "code",
    "Each figure has a code. The first letter stands for one feature and the second letter for another. What is the code for the last figure?",
    code_stem([(arrow(a, f), DIR[a] + SHADE[f]) for a, f in ex], arrow(180, WHITE)),
    DIR[180] + SHADE[WHITE], ["HY", "GX", "XH", "FX"],
    "The first letter is the direction (F up, G right, H down) and the second is the shading (W black, X white, Y grey). Pointing down and white: HX.",
    option_format="text")
# 17 Similarity: every shape has an even number of sides
def pair_s(a, b, fa=WHITE, fb=GREY):
    return shape(a, fill=fa, cx=24, cy=40, r=15) + shape(b, fill=fb, cx=56, cy=40, r=15)
assert all(SIDES[k] % 2 == 0 for k in ("square", "hexagon", "octagon"))
nvr("Similarities", "Find the rule", "similarity", "Which option is most like the two figures on the left?",
    row_of([pair_s("square", "hexagon"), pair_s("octagon", "square", GREY, WHITE)]),
    opt(pair_s("hexagon", "octagon", INK, WHITE)),
    [opt(pair_s("pentagon", "hexagon")), opt(pair_s("square", "triangle")), opt(pair_s("circle", "square")), opt(pair_s("heptagon", "octagon"))],
    "Every shape in the examples has an even number of sides (4, 6, 8). Only the hexagon with the octagon also does. Colour does not matter.")
# 18 Hidden shape
TARGET = [(0, 0), (24, 0), (24, 12), (12, 12), (12, 30), (0, 30)]   # an L, 24 wide, 30 tall
def hidden(pts_shape, extra):
    return outline(pts_shape) + lines(extra)
EXTRA = [(10, 20, 70, 20), (50, 10, 50, 70), (14, 60, 66, 60), (30, 34, 66, 34), (20, 70, 64, 14)]
good_pts = place(TARGET, 26, 26)
nvr("Hidden shapes", "Find the shape", "hidden shape",
    "In which option is the shape on the left hidden? It must be the same size and the same way round.",
    row_of([outline(place(TARGET, 28, 25), 2.5)]),
    opt(hidden(good_pts, EXTRA)),
    [opt(hidden(place(mirror_pts(TARGET), 26, 26), EXTRA)), opt(hidden(place(turn_pts(TARGET, 1), 26, 26), EXTRA)),
     opt(hidden(place(turn_pts(TARGET, 2), 26, 26), EXTRA)), opt(hidden(place([(x * 1.4, y * 1.4) for x, y in TARGET], 20, 20), EXTRA))],
    "The L must be found exactly as it is, the same size and not turned or reflected. The other options hide a mirror image, a turned L or a larger L.")
# 19 Put one figure on top of the other
FA = lines([(14, 14, 66, 14), (14, 14, 14, 66), (40, 14, 40, 66)]) + f'<circle cx="58" cy="54" r="7" fill="{INK}"/>'
FB = lines([(14, 66, 66, 66), (66, 14, 66, 66), (14, 40, 66, 40)]) + f'<circle cx="26" cy="28" r="7" fill="none" stroke="{INK}" stroke-width="2"/>'
nvr("Combining", "Overlay", "combining figures", "Which option shows the first two figures placed exactly on top of each other?",
    row_of([FA, FB]), opt(FA + FB),
    [opt(FA + tf(FB, HFLIP)), opt(FA + lines([(14, 66, 66, 66), (66, 14, 66, 66)])), opt(tf(FA, VFLIP) + FB), opt(FA + rot(FB, 90))],
    "Everything from both figures appears in the same place: the grid of lines, the black dot at the bottom right and the white ring at the top left.")
# 20 Nested squares: the black band moves inwards; a centre line turns 90°
def nested2(black, angle):
    out = ""
    sizes = (30, 20, 10)
    for i, h in enumerate(sizes):
        out += f'<rect x="{40 - h}" y="{40 - h}" width="{2 * h}" height="{2 * h}" fill="{INK if i == black else WHITE}" stroke="{INK}" stroke-width="2"/>'
    return out + (f'<g transform="rotate({angle} 40 40)"><line x1="40" y1="33" x2="40" y2="47" stroke="{GREY}" stroke-width="3"/>'
                  f'<circle cx="40" cy="33" r="2.5" fill="{GREY}"/></g>')
fr = [(k % 3, 90 * k) for k in range(5)]
nvr("Sequences", "Two rules", "sequence", SEQ_Q, frame_strip([nested2(*f) for f in fr[:4]]),
    opt(nested2(1, 0)), [opt(nested2(1, 360 - 90)), opt(nested2(2, 0)), opt(nested2(0, 0)), opt(nested2(1, 180))],
    "The black square moves one step inwards each time, starting again from the outside after the centre. The small line in the middle turns 90° clockwise, so after four turns it points up again.")


# 21-24: added when Non-Verbal became 3 parts of 8 (migration 058)
from nvr_extra import cube_opposite, symmetry, fold_over, turning_arrow
add(**cube_opposite({(0, 0): "triangle", (1, 0): "circle", (1, 1): "black", (1, 2): "cross", (1, 3): "dot", (2, 2): "stripes"}, "black"))
add(**symmetry({(0, 0), (1, 0), (1, 2), (0, 3)}))
add(**fold_over([f'<polygon points="12,14 26,14 12,32" fill="{INK}"/>',
                 f'<circle cx="32" cy="40" r="4" fill="{INK}"/>',
                 f'<rect x="14" y="50" width="14" height="12" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>']))
add(**turning_arrow(0, 135, [INK, WHITE],
    "The arrow turns 135° clockwise each time (a right angle and a half) and alternates black and white. After four turns it has gone 540°, so it points down, and it is black."))

S.write(sys.argv[1], "mock-test-3-set-1",
        {"name": "Mock Test 3", "stage": "Challenger", "programmeCode": "GRAMMAR"}, 1,
        [{"subject": "ENGLISH", "sectionOrder": 1, "durationMinutes": 15},
         {"subject": "MATHS", "sectionOrder": 2, "durationMinutes": 15},
         {"subject": "VERBAL", "sectionOrder": 3, "durationMinutes": 10},
         {"subject": "NON_VERBAL", "sectionOrder": 4, "durationMinutes": 10}],
        TITLE, STORY, "Mock Test 3 · Set 1 · Challenger")
