"""Builds Mock Test 1, Set 2 (Challenger): original content only.

Set 1 used a story; Set 2 uses an original non-fiction article so the paper
covers both. No question, passage or figure rule is reused from Set 1.
Maths and Verbal answers are recomputed and asserted; Non-Verbal figures are
drawn from their rules.

Usage:  python -I docs/mock-tests/build_mock1_set2.py docs/mock-tests
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fractions import Fraction
from mock_lib import (MockSet, INK, GREY, WHITE, LET, svg, opt, shape, dots, arrow, tf, HFLIP, VFLIP,
                      frame_strip, analogy, matrix, code_stem, mirror_stem, hmirror_stem)

S = MockSet(seed=20261120)
add = S.add

# =========================================================================
# ENGLISH - original non-fiction article
# =========================================================================
TITLE = "In Praise of Getting Lost"
STORY = """My father had a rule about maps: they stayed in the glovebox until we were properly, thoroughly lost. "Anyone can follow a line," he would say, tapping the steering wheel. "Finding your way back to one is the real skill." My mother called this rule "the scenic route". My little brother called it "the long way to the toilets".

I used to think the rule was simply stubbornness, a grown man refusing to admit that he needed help. It took me twenty years, and one very wet afternoon in the Yorkshire Dales, to realise that it was something closer to a gift.

I was eleven that summer and my brother was eight. Our father had decided that we would walk from the village where we were staying to a waterfall he remembered from his own childhood. He remembered it vaguely. He remembered the path even more vaguely. After an hour, the path itself seemed to have forgotten where it was going: it thinned into a sheep track, then into a suggestion, then into nothing at all.

Panic arrived the way weather arrives in the hills: first as a grey smudge on the horizon, then all at once, soaking everything. My brother began to cry. I began to blame. Our father sat down on a rock, unwrapped a slightly squashed sandwich and asked us a question I have never forgotten.

"Which way is the wind coming from?"

At the time, it seemed the most ridiculous question a person could ask. We were lost; we were wet; we wanted answers, not a geography lesson. But he waited, chewing, until we stopped shouting long enough to feel the wind on our faces. Then he asked about the sun, which was hiding but not entirely invisible. Then about the stream we could hear but not see. Piece by piece, like a jigsaw with no picture on the box, we worked out where the village must be. Forty minutes later we walked into it, muddy and triumphant, as though we had discovered it ourselves.

We never did find the waterfall.

Today, I could not get lost in the Dales if I tried. My phone knows where I am to within a few metres. It tells me when to turn, how long the walk will take and where the nearest café is. It even warns me, politely, when it is about to rain. It is astonishingly useful, and I would not give it up. Yet I sometimes wonder what it costs.

When a blue dot does the thinking, we stop looking up. People who are told every turn often remember less of the route afterwards, which is hardly surprising: why would the brain bother to store something it can simply look up? But there is a difference between knowing where you are and knowing how you got there. The first is information. The second is understanding.

Getting lost, safely and not too often, forces us to notice things: the slope of a hill, the angle of a shadow, the sound of water. It asks us to stay calm when the answer is not handed to us. It teaches us that feeling uncertain is not the same as being in danger. These are not small lessons. Most of the important problems we will ever face do not come with a blue dot.

I am not suggesting that anyone should throw their phone into a river. (My father, for the record, now owns two.) But I do think we might occasionally leave it in our pocket, choose a direction and trust ourselves to find the way back. The worst that usually happens is a longer walk and a better story.

Last spring, I took my own daughter to the Dales. Halfway along a path that neither of us knew, she stopped and frowned at the sky.

"Which way is the wind coming from?" she asked.

I have never been prouder to be lost."""

E = "ENGLISH"
def eng(qtype, quest, answer, distractors, explanation):
    add(E, "Comprehension", None, qtype, quest, answer, distractors, explanation)

eng("retrieval", "Where did the writer's father keep the maps until the family was lost?",
    "In the glovebox", ["In his coat pocket", "On the back seat", "In his rucksack", "At home in a drawer"],
    "The first sentence says the maps 'stayed in the glovebox'.")
eng("viewpoint", "How did the writer's opinion of the father's rule change over time?",
    "The writer once saw it as stubbornness but now sees it as a gift",
    ["The writer once found it useful but now thinks it is dangerous", "The writer has always thought it was a gift",
     "The writer once found it funny but now finds it annoying", "The writer has never understood why he had it"],
    "'I used to think the rule was simply stubbornness... it was something closer to a gift.'")
eng("language effects",
    "The path \"thinned into a sheep track, then into a suggestion, then into nothing at all\". What is the effect of this list?",
    "It shows the path gradually disappearing until they were completely lost",
    ["It shows that the sheep were blocking the path", "It suggests that the path was getting wider",
     "It shows that the father knew exactly where he was", "It suggests that the walk was nearly over"],
    "Each step in the list is fainter than the last, building up to 'nothing at all'.")
eng("language effects",
    "\"Panic arrived the way weather arrives in the hills.\" What does this comparison suggest about the panic?",
    "It began as a small worry and then suddenly overwhelmed them",
    ["It disappeared as soon as the sun came out", "It was caused by a thunderstorm",
     "It stayed small and easy to ignore", "It only affected their father"],
    "Like hill weather, it appears as 'a grey smudge' and then comes 'all at once, soaking everything'.")
eng("multi-step reasoning", "\"My brother began to cry. I began to blame.\" What does this tell us?",
    "The children reacted differently: one was upset, the other looked for someone to be at fault",
    ["Both children blamed their father", "The writer was crying because of the cold",
     "The brother blamed the writer for getting lost", "Neither child was worried"],
    "The two short sentences set the brother's tears against the writer's blaming.")
eng("motivation", "Why did the father ask, \"Which way is the wind coming from?\"",
    "To calm the children and get them to use clues to find the way themselves",
    ["Because he wanted to know whether it was going to rain", "To change the subject from the waterfall",
     "Because he had forgotten his own compass", "To give them a geography test for school"],
    "He waits until they stop shouting, then leads them clue by clue to work out where the village is.")
eng("language effects", "\"Like a jigsaw with no picture on the box\". What does this suggest about how they found the way?",
    "They fitted clues together without knowing in advance what the answer would look like",
    ["They had to do a jigsaw puzzle before they could leave", "The map they were using was torn into pieces",
     "They gave up because the task was impossible", "They followed a picture on a signpost"],
    "Each clue (wind, sun, stream) is a piece; with no picture to copy, they had to work it out.")
eng("retrieval", "How long after the father's question did the family walk into the village?",
    "About forty minutes", ["About an hour", "About twenty minutes", "Several hours", "The next morning"],
    "'Forty minutes later we walked into it.'")
eng("author's purpose", "Why does the writer put \"We never did find the waterfall.\" in a paragraph on its own?",
    "To show, with gentle humour, that the original goal no longer mattered",
    ["To warn readers that the waterfall is dangerous", "To show that the father had lied about it",
     "To explain why the family went home early", "To make the reader feel sorry for the brother"],
    "Setting the line apart makes it stand out: the real reward was finding their way, not the waterfall.")
eng("viewpoint", "What is the writer's attitude to their phone?",
    "The writer finds it very useful but worries about what relying on it costs us",
    ["The writer thinks phones should be banned on walks", "The writer refuses to use one",
     "The writer thinks phones are useless in the countryside", "The writer sees nothing wrong with relying on it completely"],
    "'It is astonishingly useful, and I would not give it up. Yet I sometimes wonder what it costs.'")
eng("vocabulary", "Which word is closest in meaning to \"astonishingly\" as it is used in the article?",
    "Amazingly", ["Slightly", "Worryingly", "Hardly", "Unfortunately"],
    "'Astonishingly useful' means amazingly or remarkably useful.")
eng("multi-step reasoning",
    "The writer says \"there is a difference between knowing where you are and knowing how you got there\". What does the writer mean?",
    "Being told your position gives you facts, but finding the way yourself builds real understanding",
    ["Phones are more accurate than maps", "It is impossible to know where you are without a phone",
     "People should always walk the same route twice", "Getting lost is always dangerous"],
    "The writer explains: 'The first is information. The second is understanding.'")
eng("author's purpose", "\"Most of the important problems we will ever face do not come with a blue dot.\" What is the writer suggesting?",
    "In life we often have to solve problems without someone showing us the answer",
    ["Most problems can be solved using a phone", "Blue dots are the most important part of a map",
     "People should avoid solving difficult problems", "Problems are easier to solve in the countryside"],
    "The 'blue dot' stands for being handed the answer; real problems rarely work that way.")
eng("author's purpose", "Why does the writer add \"(My father, for the record, now owns two.)\"?",
    "To add humour and show that even the writer's father is not against technology",
    ["To prove that the father is very wealthy", "To complain that the father uses his phone too much",
     "To explain where the writer got their own phone", "To show that the father has changed his rule about maps"],
    "The aside is light-hearted and reassures readers that the article is not anti-phone.")
eng("multi-step reasoning", "Why does the writer say getting lost should happen \"safely and not too often\"?",
    "To make clear the writer is not encouraging people to put themselves in real danger",
    ["Because getting lost is against the law", "Because the writer wants people to stay at home",
     "Because the writer thinks getting lost is always fun", "Because the writer's father insisted on it"],
    "The qualification keeps the argument balanced: the writer values the lessons, not the risk.")
eng("author's purpose", "What is the main purpose of the article?",
    "To persuade readers that finding their own way now and then is worthwhile",
    ["To give directions to a waterfall in the Dales", "To advertise a new kind of phone",
     "To warn that the Yorkshire Dales are dangerous", "To explain how satnav works"],
    "Through a personal story and an argument, the writer encourages readers to sometimes leave the phone in their pocket.")
eng("structure", "Why does the article end with the writer's daughter asking about the wind?",
    "It echoes the father's question, showing the lesson has been passed down",
    ["It shows that the daughter is frightened of bad weather", "It proves that the daughter wants a phone",
     "It explains why they never reached the waterfall", "It shows that the writer has forgotten the father's lesson"],
    "The daughter repeats her grandfather's exact words, bringing the story full circle.")
eng("multi-step reasoning", "\"I have never been prouder to be lost.\" Why is the writer proud?",
    "The daughter has learned to think for herself in the same way the writer once did",
    ["The writer has finally found the waterfall", "The writer managed to walk without a map for the first time",
     "The daughter has a better phone than the writer", "The writer has proved the father wrong"],
    "The daughter instinctively asks the same clue-finding question, so being lost becomes a proud moment.")

# =========================================================================
# MATHS
# =========================================================================
M = "MATHS"
def money(p):
    return f"£{p // 100}.{p % 100:02d}"

assert 368 * 27 == 9936
add(M, "Number", "Long multiplication", "calculation", "What is 368 × 27?",
    "9,936", ["9,836", "9,926", "8,936", "10,036"], "368 × 20 = 7,360 and 368 × 7 = 2,576; 7,360 + 2,576 = 9,936.")
assert Fraction(2, 3) + Fraction(3, 4) == Fraction(17, 12)
add(M, "Fractions", "Adding fractions", "calculation", "What is 2/3 + 3/4?",
    "1 5/12", ["5/7", "1 1/12", "5/12", "1 7/12"], "8/12 + 9/12 = 17/12 = 1 5/12.")
assert Fraction(35, 100) * 260 == 91
add(M, "Percentages", "Percentage of an amount", "calculation", "What is 35% of 260?",
    "91", ["81", "98", "90", "9.1"], "10% is 26, so 30% is 78 and 5% is 13; 78 + 13 = 91.")
assert Fraction(300, 4) * 10 == 750
add(M, "Ratio", "Scaling a recipe", "word problem",
    "A recipe for 4 people uses 300 g of flour. How much flour is needed for 10 people?",
    "750 g", ["600 g", "700 g", "800 g", "1,200 g"], "300 ÷ 4 = 75 g per person; 75 × 10 = 750 g.")
assert (14 + 8) / (5 - 3) == 11
add(M, "Algebra", "Equations", "calculation", "Solve 5x − 8 = 3x + 14.",
    "x = 11", ["x = 3", "x = 22", "x = 6", "x = 13"], "Subtract 3x: 2x − 8 = 14, so 2x = 22 and x = 11.")
assert 7 + 9 * 4 == 43
add(M, "Algebra", "Sequences", "pattern", "What is the 10th term of the sequence 7, 11, 15, 19, …?",
    "43", ["47", "39", "40", "74"], "It goes up by 4 each time. The 10th term is 7 + 9 × 4 = 43.")
vals = sorted([8, 3, 11, 6, 9, 4]); assert (vals[2] + vals[3]) / 2 == 7
add(M, "Statistics", "Median", "calculation", "What is the median of 8, 3, 11, 6, 9 and 4?",
    "7", ["6", "8", "6.5", "7.5"], "In order: 3, 4, 6, 8, 9, 11. The middle two are 6 and 8, so the median is 7.")
TRI = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 150" width="300" height="205">'
       '<polygon points="30,120 198,120 80,12" fill="#e0f2fe" stroke="#1f2937" stroke-width="2"/>'
       '<line x1="80" y1="12" x2="80" y2="120" stroke="#1f2937" stroke-width="1.5" stroke-dasharray="5,4"/>'
       '<rect x="80" y="110" width="10" height="10" fill="none" stroke="#1f2937" stroke-width="1.2"/>'
       '<text x="114" y="138" font-size="11" text-anchor="middle" fill="#1f2937">14 cm</text>'
       '<text x="86" y="70" font-size="11" fill="#1f2937">9 cm</text>'
       '<text x="146" y="58" font-size="11" fill="#1f2937">11 cm</text>'
       '<text x="114" y="149" font-size="9" text-anchor="middle" fill="#6b7280">Not drawn to scale</text></svg>')
assert Fraction(14 * 9, 2) == 63
add(M, "Shape", "Area of a triangle", "diagram", "What is the area of this triangle?",
    "63 cm²", ["77 cm²", "126 cm²", "154 cm²", "99 cm²"],
    "Area = ½ × base × perpendicular height = ½ × 14 × 9 = 63 cm². The 11 cm side is not the height.", stem=TRI)
assert (18 * 60 + 45 + 2 * 60 + 25) == 21 * 60 + 10
add(M, "Measures", "Time", "word problem", "A film starts at 18:45 and lasts 2 hours 25 minutes. When does it finish?",
    "21:10", ["20:10", "21:20", "20:50", "21:00"], "18:45 + 2 h = 20:45; + 25 min = 21:10.")
assert Fraction(72, 10) / Fraction(4, 100) == 180
add(M, "Number", "Dividing decimals", "calculation", "What is 7.2 ÷ 0.04?",
    "180", ["18", "1.8", "1,800", "0.18"], "Multiply both by 100: 720 ÷ 4 = 180.")
assert 360 - 85 - 110 - 75 == 90
add(M, "Shape", "Angles in a quadrilateral", "calculation",
    "Three angles of a quadrilateral are 85°, 110° and 75°. What is the fourth angle?",
    "90°", ["80°", "100°", "270°", "180°"], "Angles in a quadrilateral add up to 360°: 360 − 85 − 110 − 75 = 90°.")
assert -7 + 12 - 9 == -4
add(M, "Number", "Negative numbers", "word problem",
    "At midnight the temperature is −7 °C. By noon it has risen by 12 °C. By evening it has fallen by 9 °C. What is the evening temperature?",
    "−4 °C", ["4 °C", "−14 °C", "2 °C", "−2 °C"], "−7 + 12 = 5; 5 − 9 = −4 °C.")
assert 270 // 6 == 45 and 192 // 4 == 48
add(M, "Measures", "Best value", "multi-step",
    "Pack A has 6 rolls for £2.70. Pack B has 4 rolls for £1.92. How much cheaper per roll is Pack A?",
    "3p", ["2p", "4p", "5p", "78p"], "Pack A: £2.70 ÷ 6 = 45p. Pack B: £1.92 ÷ 4 = 48p. 48p − 45p = 3p.")
add(M, "Number", "Place value", "reasoning", "What is the value of the digit 7 in 3.476?",
    "7 hundredths", ["7 units", "7 tenths", "7 thousandths", "7 tens"],
    "3.476 = 3 units, 4 tenths, 7 hundredths, 6 thousandths.")
assert Fraction(6 * 4 * 25, 10) == 60 and 2 * (24 + 15 + 10) == 98
add(M, "Shape", "Volume", "calculation", "A cuboid measures 6 cm by 4 cm by 2.5 cm. What is its volume?",
    "60 cm³", ["12.5 cm³", "24 cm³", "98 cm³", "50 cm³"], "6 × 4 × 2.5 = 60 cm³.")
factors = [d for d in range(1, 37) if 36 % d == 0]; assert len(factors) == 9
add(M, "Number", "Factors", "reasoning", "How many factors does 36 have?",
    "9", ["8", "6", "10", "12"], "1, 2, 3, 4, 6, 9, 12, 18 and 36: nine factors.")
add(M, "Shape", "Coordinates", "reasoning",
    "Three corners of a square are at (1, 1), (5, 1) and (5, 5). Where is the fourth corner?",
    "(1, 5)", ["(4, 1)", "(1, 4)", "(5, 0)", "(0, 5)"], "The square has sides of 4 units; the missing corner is above (1, 1) at (1, 5).")
assert Fraction(150, Fraction(5, 2)) == 60
add(M, "Measures", "Speed", "word problem", "A car travels 150 km in 2 hours 30 minutes. What is its average speed?",
    "60 km/h", ["75 km/h", "50 km/h", "65 km/h", "375 km/h"], "2 h 30 min = 2.5 h; 150 ÷ 2.5 = 60 km/h.")
s = 9; assert (s + 4) + (3 * s + 4) == 44
add(M, "Algebra", "Forming equations", "multi-step",
    "Ali is three times as old as his sister. In 4 years' time their ages will add up to 44. How old is Ali now?",
    "27", ["9", "33", "36", "18"], "Sister s, Ali 3s. In 4 years: (s + 4) + (3s + 4) = 44, so 4s = 36, s = 9 and Ali is 27.")
assert Fraction(2, 4) == Fraction(1, 2)
add(M, "Statistics", "Probability", "reasoning", "Two fair coins are tossed. What is the probability of getting exactly one head?",
    "1/2", ["1/4", "3/4", "1/3", "2/3"], "The outcomes are HH, HT, TH, TT. Exactly one head: HT or TH, so 2/4 = 1/2.")

# =========================================================================
# VERBAL REASONING
# =========================================================================
V = "VERBAL"
def shift(word, k):
    return "".join(chr((ord(c) - 65 + k) % 26 + 65) for c in word)
def atbash(word):
    return "".join(chr(155 - ord(c)) for c in word)
def hides(pair, word):
    a, b = pair.lower().split()
    j = a + b
    return any(j[i:i + len(word)] == word and i < len(a) < i + len(word) for i in range(len(j)))

assert shift("PLANET", -3) == "MIXKBQ"
add(V, "Codes", "Letter shift", "letter code",
    "In a code, PLANET is written as MIXKBQ. How would RIVER be written in the same code?",
    shift("RIVER", -3), [shift("RIVER", -2), shift("RIVER", -4), shift("RIVER", 3), "OFSBP"],
    "Each letter moves three places back in the alphabet: R→O, I→F, V→S, E→B, R→O.")
assert atbash("GOLD") == "TLOW"
add(V, "Codes", "Mirror alphabet", "letter code",
    "In a code, GOLD is written as TLOW. How would SILVER be written in the same code?",
    atbash("SILVER"), ["HRLEVI", "TJMWFS", "HROEIV", "RHOEVI"],
    "Each letter is swapped with its partner from the other end of the alphabet (A↔Z, B↔Y, …): S→H, I→R, L→O, V→E, E→V, R→I.")
seq = ["B", "E", "I", "N"]
gaps = [ord(seq[i + 1]) - ord(seq[i]) for i in range(3)]; assert gaps == [3, 4, 5]
nxt = chr(ord("N") + 6); assert nxt == "T"
add(V, "Series", "Letter series", "letter series", "Find the next letter in the series: B, E, I, N, ?",
    nxt, ["S", "U", "R", "O"], "The gaps grow by one each time: +3, +4, +5, so the next is +6: N → T.")
s = [2, 6, 12, 20, 30]; assert all(s[i] == (i + 1) * (i + 2) for i in range(5))
add(V, "Series", "Number series", "number series", "Find the next number: 2, 6, 12, 20, 30, ?",
    "42", ["40", "36", "44", "48"], "The differences are 4, 6, 8, 10, so the next difference is 12: 30 + 12 = 42.")
s = [1, 10, 3, 20, 5, 30]
assert s[0::2] == [1, 3, 5] and s[1::2] == [10, 20, 30]
add(V, "Series", "Two series", "number series", "Find the next number: 1, 10, 3, 20, 5, 30, ?",
    "7", ["40", "6", "9", "35"], "Two series are mixed together: 1, 3, 5, 7 and 10, 20, 30. Next comes 7.")
assert hides("Paul overslept", "love")
add(V, "Hidden words", "Across two words", "hidden word",
    "A four-letter word is hidden across the end of one word and the start of the next. Which pair hides it?\n\"Paul overslept again because his alarm failed.\"",
    "Paul overslept", ["overslept again", "again because", "because his", "his alarm"],
    "Pau(L OVE)rslept hides the word LOVE.")
assert hides("came at", "meat")
add(V, "Hidden words", "Across two words", "hidden word",
    "A four-letter word is hidden across the end of one word and the start of the next. Which pair hides it?\n\"Our tea came at six.\"",
    "came at", ["Our tea", "tea came", "at six", "None of these"], "ca(ME AT) hides the word MEAT.")
add(V, "Vocabulary", "Synonyms", "synonym", "Which word is closest in meaning to FRAGILE?",
    "delicate", ["sturdy", "fragrant", "heavy", "ancient"], "Fragile means easily broken: delicate.")
add(V, "Vocabulary", "Antonyms", "antonym", "Which word is most nearly the OPPOSITE of GENEROUS?",
    "mean", ["kind", "wealthy", "grateful", "honest"], "Generous means happy to give; the opposite is mean.")
add(V, "Vocabulary", "Odd one out", "classification", "Which word does NOT belong with the others?",
    "flute", ["violin", "cello", "harp", "guitar"], "Violin, cello, harp and guitar have strings; a flute is a wind instrument.")
add(V, "Word building", "Compound words", "compound word",
    "Which word can go after all of these to make three new words?  foot___   sun___   star___",
    "light", ["ball", "fish", "step", "shine"], "footlight, sunlight, starlight. (Ball and step only work with foot; fish and shine only with sun and star.)")
add(V, "Vocabulary", "Analogies", "analogy", "Author is to book as composer is to ?",
    "symphony", ["orchestra", "piano", "conductor", "concert"], "An author writes a book; a composer writes a symphony.")
add(V, "Word building", "Missing letter", "missing letter",
    "Which letter completes both words?  fro (?)   (?) ate",
    "g", ["t", "s", "d", "n"], "frog and gate. None of the other letters makes two real words.")
words = ["stripe", "strike", "strife", "string", "stride"]
assert sorted(words)[-1] == "stripe"
add(V, "Alphabet", "Alphabetical order", "alphabetical order",
    "If these words were put in alphabetical order, which would come LAST?\nstripe   strike   strife   string   stride",
    "stripe", ["strike", "strife", "string", "stride"], "Order: stride, strife, strike, string, stripe. The last is stripe.")
assert "FLIGHT".replace("L", "", 1) == "FIGHT"
add(V, "Word building", "Move a letter", "move a letter",
    "Move one letter from the first word into the second to make two new words: FLIGHT   SOW. Which letter moves?",
    "L", ["F", "I", "G", "H"], "Taking L from FLIGHT leaves FIGHT; adding it to SOW makes SLOW.")
code = {"R": "3", "O": "1", "P": "4", "E": "2", "T": "8"}
enc = lambda w: "".join(code[c] for c in w)
assert enc("ROPE") == "3142" and enc("POET") == "4128" and enc("PORT") == "4138"
add(V, "Codes", "Number codes", "number code",
    "In a code, ROPE is written as 3142 and POET is written as 4128. What does 4138 stand for?",
    "PORT", ["TORE", "POET", "ROPE", "TROP"], "From the two codes, P=4, O=1, R=3, E=2, T=8, so 4138 is PORT.")
assert 36 // 4 + 7 == 2 * 8
add(V, "Number", "Balancing sums", "missing number", "Find the missing number: 36 ÷ 4 + 7 = 2 × ?",
    "8", ["6", "16", "4", "9"], "36 ÷ 4 + 7 = 9 + 7 = 16, and 2 × 8 = 16.")
swap = lambda w: w[-1] + w[1:-1] + w[0]
assert swap("TEAM") == "MEAT" and swap("REAP") == "PEAR"
add(V, "Word building", "Word patterns", "word pattern",
    "TEAM becomes MEAT in the same way that REAP becomes ?",
    "PEAR", ["PARE", "PAER", "EPAR", "REAP"], "The first and last letters swap places: TEAM → MEAT, REAP → PEAR.")
val = {"A": 2, "B": 4, "C": 6, "D": 8, "E": 12}
r = val["E"] // val["A"] + (val["B"] - val["A"])
ans = [k for k, v in val.items() if v == r]; assert ans == ["D"]
S.letters_question("Number", "Letters for numbers", "letter sum",
    "If A = 2, B = 4, C = 6, D = 8 and E = 12, what is (E ÷ A) + (B − A)? Give your answer as a letter.",
    "D", "E ÷ A = 6 and B − A = 2; 6 + 2 = 8, which is D.")
add(V, "Logic", "Seating", "logic",
    "Five friends, Ella, Jo, Mia, Raj and Sam, sit in a row. Mia sits at the left end. Jo sits next to Mia. Raj sits in the middle. Ella is not at either end. Who sits at the right end?",
    "Sam", ["Mia", "Jo", "Raj", "Ella"],
    "From the left: Mia, Jo, Raj. Ella is not at an end, so Ella is fourth, leaving Sam at the right end.")

# =========================================================================
# NON-VERBAL REASONING
# =========================================================================
N = "NON_VERBAL"
def nvr(topic, sub, qtype, quest, stem, answer, distractors, explanation, option_format="svg"):
    add(N, topic, sub, qtype, quest, answer, distractors, explanation, stem=stem, option_format=option_format)

SEQ_Q = "Which figure comes next in the sequence?"

# 1 Arrow turns 90° anticlockwise; fill alternates black/white
def arr(a, black):
    return arrow(a, INK if black else WHITE)
nvr("Sequences", "Two rules", "sequence", SEQ_Q,
    frame_strip([arr(a, i % 2 == 0) for i, a in enumerate((0, 270, 180, 90))]),
    opt(arr(0, True)), [opt(arr(0, False)), opt(arr(90, True)), opt(arr(270, True)), opt(arr(180, False))],
    "The arrow turns 90° anticlockwise each time and alternates black, white. Next it points up and is black.")
# 2 One side fewer each time
nvr("Sequences", "Sides", "sequence", SEQ_Q,
    frame_strip([shape(k) for k in ("octagon", "heptagon", "hexagon", "pentagon")]),
    opt(shape("square")), [opt(shape(k)) for k in ("triangle", "pentagon", "hexagon", "circle")],
    "Each shape has one side fewer: 8, 7, 6, 5, so a 4-sided shape is next.")
# 3 One more dot each time; shape alternates circle/square
def cd(kind, n):
    return shape(kind, r=27) + dots(n, r=3, gap=9, cols=3)
nvr("Sequences", "Two rules", "sequence", SEQ_Q,
    frame_strip([cd("circle" if n % 2 else "square", n) for n in (1, 2, 3, 4)]),
    opt(cd("circle", 5)), [opt(cd("square", 5)), opt(cd("circle", 4)), opt(cd("circle", 6)), opt(cd("square", 6))],
    "The number of dots goes up by one and the shape alternates circle, square. Next is a circle with 5 dots.")
# 4 Clock hand turns 30° clockwise
def hand(a):
    return (shape("circle", r=27) + f'<line x1="40" y1="40" x2="40" y2="17" stroke="{INK}" stroke-width="4" '
            f'stroke-linecap="round" transform="rotate({a} 40 40)"/><circle cx="40" cy="40" r="3.5" fill="{INK}"/>')
nvr("Sequences", "Rotation", "sequence", SEQ_Q,
    frame_strip([hand(a) for a in (0, 30, 60, 90)]),
    opt(hand(120)), [opt(hand(a)) for a in (150, 90, 300, 210)],
    "The hand turns 30° clockwise each time (like moving one hour on a clock), so next it points at 120°.")
# 5 Black square moves clockwise round the edge of a 3 × 3 grid
RING = [0, 1, 2, 5, 8, 7, 6, 3]
def ring(cell):
    out = []
    for i in range(9):
        r, c = divmod(i, 3)
        out.append(f'<rect x="{13 + c * 18}" y="{13 + r * 18}" width="18" height="18" '
                   f'fill="{INK if i == cell else WHITE}" stroke="{GREY}" stroke-width="1.5"/>')
    return "".join(out)
nvr("Sequences", "Position", "sequence", SEQ_Q,
    frame_strip([ring(RING[i]) for i in range(4)]),
    opt(ring(RING[4])), [opt(ring(c)) for c in (4, 6, 7, 3)],
    "The black square moves one place clockwise around the outside of the grid. After the middle-right square comes the bottom-right.")
# 6 Odd one out: arrows point in opposite directions (one pair is at right angles)
def pair_arrows(a, b):
    small = lambda cx, ang: f'<g transform="translate({cx},40) rotate({ang}) scale(0.55) translate(-40,-40)">{arrow(0)}</g>'
    return small(24, a) + small(56, b)
nvr("Odd one out", "Direction", "odd one out", "Which figure is the odd one out?", None,
    opt(pair_arrows(45, 135)), [opt(pair_arrows(a, a + 180)) for a in (0, 90, 135, 270)],
    "In four figures the two arrows point in exactly opposite directions. In the odd one out they are at right angles.")
# 7 Odd one out: exactly one black shape (one figure has two)
def trio(fills, order=("circle", "square", "triangle")):
    xs = (18, 40, 62)
    return "".join(shape(k, fill=f, cx=x, cy=40, r=9) for k, f, x in zip(order, fills, xs))
nvr("Odd one out", "Shading", "odd one out", "Which figure is the odd one out?", None,
    opt(trio((INK, WHITE, INK), ("square", "triangle", "circle"))),
    [opt(trio((INK, WHITE, WHITE))), opt(trio((WHITE, INK, WHITE), ("triangle", "circle", "square"))),
     opt(trio((WHITE, WHITE, INK), ("square", "circle", "triangle"))), opt(trio((WHITE, INK, WHITE), ("circle", "triangle", "square")))],
    "Every figure has a circle, a square and a triangle. In four, exactly one shape is black; the odd one out has two black shapes.")
# 8 Odd one out: symmetry about a vertical line
def mirror_points(half):
    """half: points on the left of x=40, top to bottom; returns a closed symmetric outline."""
    right = [(80 - x, y) for x, y in reversed(half)]
    return half + right
SYM = [mirror_points([(40, 12), (22, 34), (30, 34), (30, 66)])[:-1],   # arrow
       [(40, 12), (64, 40), (40, 68), (16, 40)],                       # diamond
       mirror_points([(28, 14), (14, 40), (28, 66)]),                  # hexagon
       mirror_points([(20, 20), (20, 50), (40, 64)])[:3] + [(60, 50), (60, 20)]]  # pentagon
ODD = [(16, 16), (64, 16), (64, 38), (34, 64), (16, 64)]   # square with one corner cut off: no line of symmetry
def symmetric(pts):
    return sorted((round(x, 1), y) for x, y in pts) == sorted((round(80 - x, 1), y) for x, y in pts)
assert all(symmetric(p) for p in SYM) and not symmetric(ODD)
def poly(pts, fill=GREY):
    return f'<polygon points="{" ".join(f"{x},{y}" for x, y in pts)}" fill="{fill}" stroke="{INK}" stroke-width="2"/>'
nvr("Odd one out", "Symmetry", "odd one out", "Which figure is the odd one out?", None,
    opt(poly(ODD)), [opt(poly(p)) for p in SYM],
    "Four shapes have a vertical line of symmetry (their left and right halves match). The odd one out has no line of symmetry.")
# 9 Analogy: reflect left-right
BOOT = '<polygon points="20,15 38,15 38,46 62,52 62,65 20,65" fill="{f}" stroke="#1f2937" stroke-width="2"/>'
def boot(fill=GREY):
    return BOOT.format(f=fill)
def hook():
    return (f'<polygon points="18,60 18,20 34,20 34,44 62,44 62,60" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
            f'<circle cx="54" cy="30" r="6" fill="{INK}"/>')
AN_Q = "The first figure changes into the second. Which option changes in the same way from the third figure?"
nvr("Analogies", "Reflection", "analogy", AN_Q,
    analogy(boot(), tf(boot(), HFLIP), hook()),
    opt(tf(hook(), HFLIP)), [opt(hook()), opt(tf(hook(), VFLIP)), opt(tf(hook(), "rotate(180 40 40)")), opt(tf(hook(), "rotate(90 40 40)"))],
    "The first figure is reflected left to right. Reflecting the third figure left to right gives the answer.")
# 10 Analogy: one more side
nvr("Analogies", "Sides", "analogy", AN_Q,
    analogy(shape("triangle"), shape("square"), shape("pentagon")),
    opt(shape("hexagon")), [opt(shape("pentagon")), opt(shape("heptagon")), opt(shape("square")), opt(shape("hexagon", fill=GREY))],
    "The shape gains one side (3 → 4). So the pentagon (5) becomes a white hexagon (6).")
# 11 Analogy: number of dots doubles, shape stays
def sd(kind, n):
    return shape(kind, r=27) + dots(n, r=3, gap=9, cols=3)
nvr("Analogies", "Counting", "analogy", AN_Q,
    analogy(sd("square", 2), sd("square", 4), sd("circle", 3)),
    opt(sd("circle", 6)), [opt(sd("circle", 5)), opt(sd("circle", 4)), opt(sd("square", 6)), opt(sd("circle", 3))],
    "The shape stays the same and the number of dots doubles: 2 → 4, so 3 → 6.")
# 12 Reflection in a horizontal mirror line
P1 = (f'<polygon points="16,18 46,18 46,30 62,30 62,62 34,62 34,42 16,42" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
      f'<circle cx="24" cy="30" r="4" fill="{INK}"/>')
nvr("Reflection", "Horizontal mirror", "reflection",
    "Which option shows the figure reflected in the dashed mirror line below it?", hmirror_stem(P1),
    opt(tf(P1, VFLIP)), [opt(P1), opt(tf(P1, HFLIP)), opt(tf(P1, "rotate(180 40 40)")), opt(tf(P1, "rotate(90 40 40)"))],
    "A reflection in a horizontal line swaps top and bottom but keeps left and right.")
# 13 Reflection in a vertical mirror line (two-part figure)
P2 = (f'<polygon points="16,62 16,30 40,18 40,62" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
      f'<circle cx="56" cy="26" r="7" fill="{INK}"/><line x1="46" y1="62" x2="64" y2="44" stroke="{INK}" stroke-width="3"/>')
nvr("Reflection", "Vertical mirror", "reflection",
    "Which option shows the figure reflected in the dashed mirror line?", mirror_stem(P2),
    opt(tf(P2, HFLIP)), [opt(P2), opt(tf(P2, VFLIP)), opt(tf(P2, "rotate(180 40 40)")), opt(tf(tf(P2, HFLIP), "rotate(90 40 40)"))],
    "Left and right swap: the circle moves to the left, and the sloping line now slopes the other way.")
# 14 Rotation 180°
P3 = (f'<polygon points="14,26 46,26 46,16 66,36 46,56 46,46 14,46" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>'
      f'<rect x="18" y="56" width="12" height="12" fill="{INK}"/>')
nvr("Rotation", "Half turn", "rotation", "Which option shows the figure turned through 180° (a half turn)?",
    frame_strip([P3], question=False),
    opt(tf(P3, "rotate(180 40 40)")), [opt(tf(P3, HFLIP)), opt(tf(P3, VFLIP)), opt(tf(P3, "rotate(90 40 40)")), opt(P3)],
    "A half turn makes the arrow point left and moves the black square from bottom-left to top-right.")
# 15 Rotation 90° anticlockwise
P4 = (f'<polygon points="22,62 22,18 52,18 52,32 36,32 36,62" fill="{GREY}" stroke="{INK}" stroke-width="2"/>'
      f'<circle cx="58" cy="56" r="6" fill="{INK}"/>')
nvr("Rotation", "Quarter turn", "rotation", "Which option shows the figure turned 90° anticlockwise?",
    frame_strip([P4], question=False),
    opt(tf(P4, "rotate(-90 40 40)")),
    [opt(tf(P4, "rotate(90 40 40)")), opt(tf(P4, "rotate(180 40 40)")), opt(tf(P4, HFLIP)), opt(tf(tf(P4, HFLIP), "rotate(-90 40 40)"))],
    "A quarter turn anticlockwise moves the top of the figure to the left; the black circle moves from bottom-right to top-right.")
# 16 Matrix 2 × 2: each figure turns 90° clockwise across the row
nvr("Matrices", "2 × 2", "matrix", "Which option completes the grid?",
    matrix([arrow(0, GREY), arrow(90, GREY), hook()], 2),
    opt(tf(hook(), "rotate(90 40 40)")),
    [opt(tf(hook(), "rotate(-90 40 40)")), opt(tf(hook(), "rotate(180 40 40)")), opt(tf(hook(), HFLIP)), opt(hook())],
    "Across each row the figure turns 90° clockwise, as the arrow does in the top row.")
# 17 Matrix 3 × 3: each row has one of each shape and one of each shading
grid = [[("circle", INK), ("square", GREY), ("triangle", WHITE)],
        [("square", WHITE), ("triangle", INK), ("circle", GREY)],
        [("triangle", GREY), ("circle", WHITE), ("square", INK)]]
for row in grid:
    assert {k for k, _ in row} == {"circle", "square", "triangle"} and {f for _, f in row} == {INK, GREY, WHITE}
for c in range(3):
    assert {grid[r][c][0] for r in range(3)} == {"circle", "square", "triangle"}
    assert {grid[r][c][1] for r in range(3)} == {INK, GREY, WHITE}
cells = [shape(k, fill=f, r=26) for row in grid for k, f in row]
nvr("Matrices", "3 × 3", "matrix", "Which option completes the grid?", matrix(cells[:-1], 3),
    opt(cells[-1]), [opt(shape("square", fill=GREY, r=26)), opt(shape("square", fill=WHITE, r=26)),
                     opt(shape("triangle", fill=INK, r=26)), opt(shape("circle", fill=INK, r=26))],
    "Every row and every column has one circle, one square and one triangle, and one black, one grey and one white shape. The missing cell is a black square.")
# 18 Codes: size letter + shape letter
SIZE = {"big": ("A", 28), "small": ("B", 13)}
SHP = {"circle": "K", "square": "L", "triangle": "M"}
ex = [("big", "circle"), ("small", "circle"), ("big", "square"), ("small", "triangle")]
nvr("Codes", "Two-letter codes", "code",
    "Each figure has a code. The first letter stands for one feature and the second letter for another. What is the code for the last figure?",
    code_stem([(shape(k, fill=GREY, r=SIZE[s][1]), SIZE[s][0] + SHP[k]) for s, k in ex], shape("triangle", fill=GREY, r=28)),
    SIZE["big"][0] + SHP["triangle"], ["MA", "BM", "AL", "AK"],
    "The first letter is the size (A big, B small); the second is the shape (K circle, L square, M triangle). A big triangle is AM.",
    option_format="text")
# 19 Codes: number-of-dots letter + shading letter
CNT = {1: "R", 2: "S", 3: "T"}
FILL = {WHITE: "D", INK: "E"}
def sq(n, fill):
    return shape("square", fill=fill, r=28) + dots(n, r=3.5, gap=10, fill=WHITE if fill == INK else INK)
ex = [(1, WHITE), (2, INK), (3, WHITE), (1, INK)]
nvr("Codes", "Two-letter codes", "code",
    "Each figure has a code. The first letter stands for one feature and the second letter for another. What is the code for the last figure?",
    code_stem([(sq(n, f), CNT[n] + FILL[f]) for n, f in ex], sq(3, INK)),
    CNT[3] + FILL[INK], ["TD", "SE", "ET", "RE"],
    "The first letter is the number of dots (R one, S two, T three); the second is the shading (D white, E black). Three dots on black is TE.",
    option_format="text")
# 20 Triangle turns 90° clockwise; shading cycles black, grey, white
CYCLE = [INK, GREY, WHITE]
def tri(a, fill):
    return tf(f'<polygon points="40,14 64,58 16,58" fill="{fill}" stroke="{INK}" stroke-width="2"/>', f"rotate({a} 40 40)")
nvr("Sequences", "Two rules", "sequence", SEQ_Q,
    frame_strip([tri(90 * i, CYCLE[i % 3]) for i in range(4)]),
    opt(tri(0, CYCLE[4 % 3])), [opt(tri(0, INK)), opt(tri(90, GREY)), opt(tri(180, GREY)), opt(tri(0, WHITE))],
    "The triangle turns 90° clockwise each time and the shading repeats black, grey, white. The 5th points up again and is grey.")

S.write(sys.argv[1], "mock-test-1-set-2",
        {"name": "Mock Test 1", "stage": "Challenger", "programmeCode": "GRAMMAR"}, 2,
        [{"subject": "ENGLISH", "sectionOrder": 1, "durationMinutes": 15},
         {"subject": "MATHS", "sectionOrder": 2, "durationMinutes": 15},
         {"subject": "VERBAL", "sectionOrder": 3, "durationMinutes": 10},
         {"subject": "NON_VERBAL", "sectionOrder": 4, "durationMinutes": 10}],
        TITLE, STORY, "Mock Test 1 · Set 2 · Challenger")
