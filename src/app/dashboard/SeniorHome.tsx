import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { ProfileCardData } from "./grammar-home";
import { displayName } from "@/lib/english";
import type { Session } from "@/lib/auth";
import {
  SidePanel,
  StudentHomeShell,
  StudyTips,
  SubjectPost,
  SubjectsHeading,
  WelcomeCard,
} from "./StudentHome";

/**
 * Home for GCSE and A-Level students.
 *
 * No GCSE / A-Level content is loaded yet, so the subjects are a fixed list
 * shown as "coming soon", and progress shows an empty state. Swap the lists
 * for real queries (scoped with inProgramme) once content exists.
 */

type Subject = { name: string; blurb: string; tile: string; mark: string };

const SUBJECTS: Record<string, Subject[]> = {
  GCSE: [
    { name: "Mathematics", blurb: "Number, algebra, geometry and statistics, Foundation and Higher.", tile: "bg-explorer-tint text-explorer", mark: "∑" },
    { name: "English Language", blurb: "Reading for meaning, language analysis and writing tasks.", tile: "bg-master-tint text-master", mark: "Aa" },
    { name: "English Literature", blurb: "Set texts, poetry and unseen extracts.", tile: "bg-starter-tint text-starter", mark: "“”" },
    { name: "Biology", blurb: "Cells, organisms, genetics and ecology.", tile: "bg-good-tint text-good", mark: "Bi" },
    { name: "Chemistry", blurb: "Atomic structure, bonding, reactions and rates.", tile: "bg-challenger-tint text-challenger", mark: "⚗" },
    { name: "Physics", blurb: "Forces, energy, waves, electricity and space.", tile: "bg-warm-tint text-warm", mark: "⚛" },
  ],
  ALEVEL: [
    { name: "Mathematics", blurb: "Pure maths, statistics and mechanics.", tile: "bg-explorer-tint text-explorer", mark: "∫" },
    { name: "Further Mathematics", blurb: "Complex numbers, matrices and further calculus.", tile: "bg-navigator-tint text-navigator", mark: "∞" },
    { name: "Biology", blurb: "Biochemistry, genetics, physiology and ecosystems.", tile: "bg-good-tint text-good", mark: "Bi" },
    { name: "Chemistry", blurb: "Physical, inorganic and organic chemistry.", tile: "bg-challenger-tint text-challenger", mark: "⚗" },
    { name: "Physics", blurb: "Mechanics, fields, quantum and particle physics.", tile: "bg-warm-tint text-warm", mark: "⚛" },
    { name: "Economics", blurb: "Micro and macro economics with data response.", tile: "bg-master-tint text-master", mark: "£" },
  ],
};

/** The GCSE / A-Level profile card and greeting. cache() so one request reads it once. */
export const loadSeniorHome = cache(async (session: Session) => {
  const profile = await prisma.userProfile.findUnique({
    where: { id: session.userId },
    select: {
      fName: true,
      mName: true,
      lName: true,
      profileName: true,
      programme: { select: { code: true, name: true } },
    },
  });

  const name = profile ? displayName(profile) : "Student";
  const programmeName = profile?.programme.name ?? session.programme;
  const subjects = SUBJECTS[profile?.programme.code ?? session.programme] ?? SUBJECTS.GCSE;
  const card: ProfileCardData = {
    name,
    subtitle: `${programmeName} student`,
    userId: profile?.profileName ?? session.profileName,
    stats: [
      { label: "Practice sessions", value: "0" },
      { label: "Questions answered", value: "0" },
      { label: "Subjects", value: String(subjects.length) },
    ],
  };
  return { card, firstName: profile?.fName?.trim() || name, programmeName, subjects };
});

export async function SeniorHome({ session }: { session: Session }) {
  const { card, firstName, programmeName, subjects } = await loadSeniorHome(session);

  return (
    <StudentHomeShell
      {...card}
      feed={
        <>
          <WelcomeCard eyebrow={`${programmeName.toUpperCase()} PREPARATION`} title={`Welcome, ${firstName}!`}>
            Your {programmeName} practice space is being prepared. Subjects will open here one by
            one - each with topic-by-topic questions, timed papers and feedback on every answer.
          </WelcomeCard>
          <SubjectsHeading />
          {subjects.map((subject) => (
            <SubjectPost key={subject.name} {...subject} />
          ))}
        </>
      }
      side={
        <>
          <SidePanel title="Your progress">
            <div className="mt-3 rounded-lg bg-ground px-3 py-6 text-center">
              <svg
                viewBox="0 0 24 24"
                className="mx-auto w-8 h-8 fill-none stroke-ink-faint [stroke-width:1.8] [stroke-linecap:round]"
                aria-hidden="true"
              >
                <path d="M4 20v-5M10 20v-9M16 20v-6M22 20V8" />
              </svg>
              <p className="mt-2 text-sm text-ink-soft">
                Scores and streaks will show here once you start practising.
              </p>
            </div>
          </SidePanel>
          <StudyTips />
        </>
      }
    />
  );
}
