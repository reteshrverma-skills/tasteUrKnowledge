import { getSession } from "@/lib/auth";
import { pupilSchoolFor } from "@/lib/school-logo";
import { QuizSchoolProvider } from "@/components/QuizSchoolLogo";

export default async function QuizLayout({ children }: { children: React.ReactNode }) {
  const pupilSchool = await pupilSchoolFor(await getSession());
  return (
    <QuizSchoolProvider url={pupilSchool?.logoUrl ?? null} schoolName={pupilSchool?.schoolName ?? ""}>
      {children}
    </QuizSchoolProvider>
  );
}
