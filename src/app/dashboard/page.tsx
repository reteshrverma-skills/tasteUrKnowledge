import { getSession } from "@/lib/auth";
import { DEFAULT_PROGRAMME, programmeOf } from "@/lib/programme";
import { studentMockPapers } from "@/lib/mock-test";
import { SeniorHome } from "./SeniorHome";
import { loadGrammarHome } from "./grammar-home";
import { StudentHomeShell, StudyTips, WelcomeCard } from "./StudentHome";
import { FocusPanel } from "./GrammarPanels";
import { MockTestsPanel } from "./MockTestsPanel";

/**
 * Home. Grammar School students see their mock tests; the practice subjects
 * are under Subjects (/dashboard/subjects). GCSE and A-Level students get
 * their own home.
 */
export default async function DashboardPage() {
  // Middleware handles authentication, so we can safely proceed
  const session = await getSession();
  // Counts only this programme's content: Grammar School, GCSE or A-Level.
  const programme = programmeOf(session);

  // GCSE and A-Level students get their own social-style home.
  if (session?.userType === "STUDENT" && programme !== DEFAULT_PROGRAMME) {
    return <SeniorHome session={session} />;
  }

  const [{ card, firstName, focusTopics }, papers] = await Promise.all([
    loadGrammarHome(session),
    session ? studentMockPapers(session.userId, programme) : Promise.resolve([]),
  ]);

  return (
    <StudentHomeShell
      {...card}
      feed={
        <>
          <WelcomeCard eyebrow="11+ GRAMMAR SCHOOL PREPARATION" title={`Hello, ${firstName}!`}>
            Sit a mock test under exam conditions, or open Subjects to practise topic by topic.
            A short round every day builds confidence fast.
          </WelcomeCard>
          <MockTestsPanel papers={papers} />
        </>
      }
      left={<FocusPanel focusTopics={focusTopics} />}
      side={<StudyTips />}
    />
  );
}
