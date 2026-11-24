import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DEFAULT_PROGRAMME, programmeOf } from "@/lib/programme";
import { studentMockPapers } from "@/lib/mock-test";
import { loadGrammarHome } from "../grammar-home";
import { StudentHomeShell, StudyTips, WelcomeCard } from "../StudentHome";
import { FocusPanel } from "../GrammarPanels";
import { MockTestsPanel } from "../MockTestsPanel";

/**
 * Mock Test (Grammar School): the mock papers open now or opening soon, and
 * the ones already sat. GCSE and A-Level students have no mock tests here.
 */
export default async function MockTestsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const programme = programmeOf(session);
  if (programme !== DEFAULT_PROGRAMME) redirect("/dashboard");

  const [{ card, focusTopics }, papers] = await Promise.all([
    loadGrammarHome(session),
    studentMockPapers(session.userId, programme),
  ]);

  return (
    <StudentHomeShell
      {...card}
      feed={
        <>
          <WelcomeCard eyebrow="MOCK TEST" title="Your mock tests">
            Sit a full paper under exam conditions, then review every answer. Mock tests show how
            ready you are on the day.
          </WelcomeCard>
          <MockTestsPanel papers={papers} />
        </>
      }
      left={<FocusPanel focusTopics={focusTopics} />}
      side={<StudyTips />}
    />
  );
}
