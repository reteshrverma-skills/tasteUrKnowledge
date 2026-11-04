"use client";

import { createContext, useContext } from "react";
import { SchoolLogoImage } from "@/components/SchoolLogo";

const QuizSchoolContext = createContext<{ url: string; schoolName: string } | null>(null);

/** Hands the school's logo down to the quiz pages, which run in the browser. */
export function QuizSchoolProvider({
  url,
  schoolName,
  children,
}: {
  url: string | null;
  schoolName: string;
  children: React.ReactNode;
}) {
  return <QuizSchoolContext value={url ? { url, schoolName } : null}>{children}</QuizSchoolContext>;
}

/** Small, so it fits the line it sits on and takes no room from the questions. */
export function QuizSchoolLogo() {
  const school = useContext(QuizSchoolContext);
  if (!school) return null;
  return <SchoolLogoImage url={school.url} schoolName={school.schoolName} className="h-8" />;
}
