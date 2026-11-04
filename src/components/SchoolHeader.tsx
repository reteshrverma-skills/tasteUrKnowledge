import { getSession } from "@/lib/auth";
import { pupilSchoolFor } from "@/lib/school-logo";
import { SCHOOL_LOGO_HEADER_CLASS, SchoolLogoImage } from "@/components/SchoolLogo";

/**
 * The top of a teacher's or a school pupil's page: the school's logo, if it
 * has one, left of its name, then the person's name in bold, and an optional
 * line about the page.
 */
export function SchoolHeader({
  schoolName,
  logoUrl,
  person,
  line,
  className = "",
}: {
  schoolName: string;
  logoUrl: string | null;
  person: string;
  line?: string;
  className?: string;
}) {
  return (
    <header className={`flex items-center gap-4 ${className}`}>
      {logoUrl && (
        <SchoolLogoImage url={logoUrl} schoolName={schoolName} className={SCHOOL_LOGO_HEADER_CLASS} />
      )}
      <div className="min-w-0">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">{schoolName}</h1>
        <p className="font-bold text-ink mt-1">{person}</p>
        {line && <p className="text-ink-soft mt-1">{line}</p>}
      </div>
    </header>
  );
}

/** The same header above a pupil's subject and review pages; nothing for anyone not in a school. */
export async function PupilSchoolHeader({ className }: { className?: string }) {
  const pupilSchool = await pupilSchoolFor(await getSession());
  return pupilSchool && <SchoolHeader {...pupilSchool} className={className} />;
}
