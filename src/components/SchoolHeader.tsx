import { getSession } from "@/lib/auth";
import { pupilSchoolFor } from "@/lib/school-logo";
import { PERSON_NAME_CLASS, SCHOOL_NAME_CLASS } from "@/components/SchoolLogo";

/**
 * The top of a teacher's or a school pupil's page: the person's name and an
 * optional line about the page. The school's name is in the top bar, so it only
 * shows here on a phone, where the bar has no room for it.
 */
export function SchoolHeader({
  schoolName,
  person,
  line,
  className = "",
}: {
  schoolName: string;
  person: string;
  line?: string;
  className?: string;
}) {
  return (
    <header className={className}>
      <p className={`${SCHOOL_NAME_CLASS} text-2xl mb-1 sm:hidden`}>{schoolName}</p>
      <h1 className={PERSON_NAME_CLASS}>{person}</h1>
      {line && <p className="text-ink-soft mt-1">{line}</p>}
    </header>
  );
}

/** The same header above a pupil's subject and review pages; nothing for anyone not in a school. */
export async function PupilSchoolHeader({ className }: { className?: string }) {
  const pupilSchool = await pupilSchoolFor(await getSession());
  return pupilSchool && <SchoolHeader {...pupilSchool} className={className} />;
}
