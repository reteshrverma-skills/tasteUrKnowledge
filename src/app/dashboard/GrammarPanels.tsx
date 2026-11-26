import Link from "next/link";
import { focusPracticeHref } from "@/lib/focus";
import { isVrSubject } from "@/lib/vr";
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

/** A focus topic's subject is named as on Progress ("Verbal Reasoning"). */
function focusMatches(focus: GrammarHome["focusTopics"][number], subjectName: string) {
  const lower = subjectName.toLowerCase();
  if (focus.subject === "Verbal Reasoning") return isVrSubject(subjectName);
  return focus.subject.toLowerCase() === lower;
}

/**
 * The Grammar School subjects side by side, one tall card each, with that
 * subject's focus topics in a row of matching columns underneath.
 */
export function GrammarSubjectColumns({
  subjects,
  focusTopics,
}: {
  subjects: GrammarHome["subjects"];
  focusTopics: GrammarHome["focusTopics"];
}) {
  const cols = "grid gap-4 sm:grid-cols-2 lg:grid-cols-4";
  return (
    <>
      <h2 id="subjects" className="font-display text-lg font-semibold text-ink scroll-mt-20">
        Pick a subject for practice
      </h2>
      <div className={cols}>
        {subjects.map(({ name, count, countsQuestions }) => {
          const style = SUBJECT_STYLES[name] ?? FALLBACK_STYLE;
          const href = count > 0 ? `/dashboard/subject/${encodeURIComponent(name)}` : undefined;
          return (
            <article key={name} className={`card p-5 flex flex-col ${href ? "" : "opacity-80"}`}>
              <span
                className={`w-12 h-12 rounded-xl grid place-items-center font-display text-base font-semibold ${style.tile}`}
                aria-hidden="true"
              >
                {style.mark}
              </span>
              <h3 className="mt-3 font-semibold text-ink">{name}</h3>
              {href ? (
                <span className="mt-1 self-start rounded-full bg-good-tint px-2 py-0.5 text-xs font-medium text-good tabular">
                  {countsQuestions
                    ? `${count.toLocaleString()} questions`
                    : `${count} comprehension${count === 1 ? "" : "s"}`}
                </span>
              ) : (
                <span className="mt-1 self-start rounded-full bg-warm-tint px-2 py-0.5 text-xs font-medium text-warm">
                  Coming soon
                </span>
              )}
              <p className="mt-2 flex-1 text-sm text-ink-soft">{style.blurb}</p>
              {href ? (
                <Link href={href} className="mt-4 btn-primary px-3.5 py-2 text-sm text-center">
                  Start practising
                </Link>
              ) : (
                <button type="button" disabled className="mt-4 btn-quiet px-3.5 py-2 text-sm">
                  Start practising
                </button>
              )}
            </article>
          );
        })}
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Your focus topics</h2>
        <p className="text-xs text-ink-faint mt-0.5">
          Chosen by your parent - a short round on each will help most.
        </p>
      </div>
      <div className={cols}>
        {subjects.map(({ name }) => {
          const mine = focusTopics.filter((f) => focusMatches(f, name));
          return (
            <div key={name} className="card p-4">
              <h3 className="text-sm font-semibold text-ink">{name}</h3>
              {mine.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {mine.map((focus) => (
                    <li
                      key={focus.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink truncate" title={focus.label}>
                          {focus.label}
                        </span>
                        {focus.level && <span className="block text-xs text-ink-faint">{focus.level}</span>}
                      </span>
                      <Link
                        href={focusPracticeHref(focus)}
                        className="btn-primary px-3 py-1.5 text-sm whitespace-nowrap"
                      >
                        Start
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-lg bg-ground px-3 py-4 text-center text-xs text-ink-faint">
                  Nothing set yet.
                </p>
              )}
            </div>
          );
        })}
      </div>
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
