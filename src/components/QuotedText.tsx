/**
 * Question text with any "quoted statement" picked out in colour, so the
 * sentence a pupil has to work on (hidden words, codes, letter moves) stands
 * apart from the instructions around it. Straight and curly quotes both count.
 * Spacing and letters are left exactly as written - hidden-word questions
 * depend on them.
 */
const QUOTED = /("[^"\n]+"|“[^”\n]+”)/g;

export function QuotedText({ text }: { text: string | null | undefined }) {
  if (!text) return null;

  return (
    <>
      {text.split(QUOTED).map((part, i) =>
        // split() with a capture group puts the quoted parts at odd indexes.
        i % 2 === 1 ? (
          <span
            key={i}
            // The theme's warm accent: it is the opposite of the teal brand
            // on the colour wheel, so it pops without clashing, and it is not
            // used for any stage or score colour.
            className="rounded-md bg-warm-tint px-1.5 py-0.5 font-semibold text-warm ring-1 ring-warm/30 box-decoration-clone"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
