import { getSession } from "@/lib/auth";
import { DEFAULT_PROGRAMME, programmeOf } from "@/lib/programme";
import { SeniorHome } from "./SeniorHome";
import { loadGrammarHome } from "./grammar-home";
import { StudentHomeShell, StudyTips, WelcomeCard } from "./StudentHome";
import { FocusPanel, GrammarSubjectList } from "./GrammarPanels";

/**
 * Home. Grammar School students see their practice subjects; mock tests are
 * under Mock Test (/dashboard/mock-tests). GCSE and A-Level students get
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

  const { card, firstName, focusTopics, subjects } = await loadGrammarHome(session);

  return (
    <StudentHomeShell
      {...card}
      feed={
        <>
          <WelcomeCard eyebrow="11+ GRAMMAR SCHOOL PREPARATION" title={`Hello, ${firstName}!`}>
            Pick a subject and a stage, then practise topic by topic. Every answer comes with
            feedback, so a short round each day goes a long way. Ready for the real thing? Open
            Mock Test.
          </WelcomeCard>
          <GrammarSubjectList subjects={subjects} />
        </>
      }
      left={<FocusPanel focusTopics={focusTopics} />}
      side={<StudyTips />}
    />
  );
}
