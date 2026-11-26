import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DEFAULT_PROGRAMME, programmeOf } from "@/lib/programme";
import { studentMockPapers } from "@/lib/mock-test";
import { loadGrammarHome } from "../grammar-home";
import { ProfileBanner } from "../StudentHome";
import { MockTestsPanel } from "../MockTestsPanel";

/**
 * Mock Test (Grammar School): the mock papers open now or opening soon, and
 * the ones already sat. GCSE and A-Level students have no mock tests here.
 * Laid out like Home: profile across the top, the papers side by side.
 */
export default async function MockTestsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const programme = programmeOf(session);
  if (programme !== DEFAULT_PROGRAMME) redirect("/dashboard");

  const [{ card }, papers] = await Promise.all([
    loadGrammarHome(session),
    studentMockPapers(session.userId, programme),
  ]);

  return (
    <div className="min-h-screen bg-ground">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        <ProfileBanner {...card} />
        <MockTestsPanel papers={papers} />
      </main>
    </div>
  );
}
