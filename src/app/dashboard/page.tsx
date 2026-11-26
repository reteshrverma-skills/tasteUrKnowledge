import { getSession } from "@/lib/auth";
import { DEFAULT_PROGRAMME, programmeOf } from "@/lib/programme";
import { SeniorHome } from "./SeniorHome";
import { loadGrammarHome } from "./grammar-home";
import { ProfileBanner } from "./StudentHome";
import { GrammarSubjectColumns } from "./GrammarPanels";

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

  const { card, focusTopics, subjects } = await loadGrammarHome(session);

  // Stacked full width: profile, the subjects side by side, then each
  // subject's focus topics underneath.
  return (
    <div className="min-h-screen bg-ground">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        <ProfileBanner {...card} />
        <GrammarSubjectColumns subjects={subjects} focusTopics={focusTopics} />
      </main>
    </div>
  );
}
