import Link from "next/link";
import { focusPracticeHref } from "@/lib/focus";
import type { loadGrammarHome } from "./grammar-home";
import { SidePanel, SubjectPost, SubjectsHeading } from "./StudentHome";

type GrammarHome = Awaited<ReturnType<typeof loadGrammarHome>>;

/**
 * One mark and one line per subject, so a child recognises where they are
 * going before reading the word.
 */
const SUBJECT_STYLES: Record<string, { tile: string; mark: string; blurb: string }> = {
  English: {
    tile: "bg-master-tint text-master",
    mark: "Aa",
    blurb: "Comprehension passages with questions on meaning, vocabulary and inference.",
  },
  Maths: {
    tile: "bg-explorer-tint text-explorer",
    mark: "7+3",
    blurb: "Arithmetic, problem solving, fractions, shapes and data.",
  },
  Verbal: {
    tile: "bg-starter-tint text-starter",
    mark: "“”",
    blurb: "Word puzzles, codes, analogies and letter sequences.",
  },
  "Non-Verbal": {
    tile: "bg-challenger-tint text-challenger",
    mark: "◧",
    blurb: "Shapes, patterns, rotations and spatial reasoning.",
  },
};

const FALLBACK_STYLE = {
  tile: "bg-ground text-ink-soft",
  mark: "?",
  blurb: "Practice questions for this subject.",
};

/** The Grammar School practice subjects, as feed posts. */
export function GrammarSubjectList({ subjects }: { subjects: GrammarHome["subjects"] }) {
  return (
    <>
      <SubjectsHeading />
      {subjects.map(({ name, count, countsQuestions }) => {
        const style = SUBJECT_STYLES[name] ?? FALLBACK_STYLE;
        return (
          <SubjectPost
            key={name}
            name={name}
            blurb={style.blurb}
            tile={style.tile}
            mark={style.mark}
            detail={
              countsQuestions
                ? `${count.toLocaleString()} questions`
                : `${count} comprehension${count === 1 ? "" : "s"}`
            }
            href={count > 0 ? `/dashboard/subject/${encodeURIComponent(name)}` : undefined}
          />
        );
      })}
    </>
  );
}

/** What a parent has asked this child to work on. */
export function FocusPanel({ focusTopics }: { focusTopics: GrammarHome["focusTopics"] }) {
  return (
    <SidePanel title="Your focus this week">
      {focusTopics.length > 0 ? (
        <>
          <p className="text-xs text-ink-faint mt-0.5">
            Chosen by your parent - a short round on each will help most.
          </p>
          <ul className="mt-3 space-y-2">
            {focusTopics.map((focus) => (
              <li
                key={focus.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink truncate">{focus.label}</span>
                  <span className="block text-xs text-ink-faint">
                    {focus.subject}
                    {focus.level ? ` · ${focus.level}` : ""}
                  </span>
                </span>
                <Link href={focusPracticeHref(focus)} className="btn-primary px-3 py-1.5 text-sm whitespace-nowrap">
                  Start
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-3 rounded-lg bg-ground px-3 py-5 text-center text-sm text-ink-soft">
          Nothing set yet. When your parent picks topics to focus on, they will show here.
        </p>
      )}
    </SidePanel>
  );
}
