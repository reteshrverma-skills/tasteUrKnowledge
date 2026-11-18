import { getSession } from "@/lib/auth";
import { DEFAULT_PROGRAMME, programmeOf } from "@/lib/programme";
import { ENTITLEMENT_LEVELS, allowedLevels } from "@/lib/student";
import { loadGrammarHome } from "./grammar-home";
import { loadSeniorHome } from "./SeniorHome";
import { ProfileCard } from "./StudentHome";

/** Dashboard subject name -> the name focus topics use for it. */
const FOCUS_SUBJECT: Record<string, string> = {
  English: "English",
  Maths: "Maths",
  Verbal: "Verbal Reasoning",
  "Non-Verbal": "Non-Verbal",
};

/**
 * A subject page with the student's profile card on the left. On a subject
 * page the counts are about that subject: stages open, its questions (or
 * comprehensions) and the parent's focus topics in it. On a phone the card
 * sits above the page.
 */
export async function WithProfileCard({
  subject,
  children,
}: {
  /** "English" | "Maths" | "Verbal" | "Non-Verbal" */
  subject: string;
  children: React.ReactNode;
}) {
  const session = await getSession();
  const senior =
    session?.userType === "STUDENT" && programmeOf(session) !== DEFAULT_PROGRAMME;

  let card;
  if (senior && session) {
    ({ card } = await loadSeniorHome(session));
  } else {
    const [home, access] = await Promise.all([loadGrammarHome(session), allowedLevels(session)]);
    const row = home.subjects.find((s) => s.name.toLowerCase() === subject.toLowerCase());
    const focusName = FOCUS_SUBJECT[subject] ?? subject;
    const focusCount = home.focusTopics.filter((f) => f.subject === focusName).length;
    const stagesOpen = access === "all" ? ENTITLEMENT_LEVELS.length : access.length;
    card = {
      ...home.card,
      stats: [
        { label: "Stages open", value: `${stagesOpen} of ${ENTITLEMENT_LEVELS.length}` },
        row && !row.countsQuestions
          ? { label: "Comprehensions", value: row.count.toLocaleString() }
          : { label: `${subject} questions`, value: (row?.count ?? 0).toLocaleString() },
        { label: "Focus topics", value: String(focusCount) },
      ],
    };
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 items-start">
      <ProfileCard {...card} className="lg:top-20" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
