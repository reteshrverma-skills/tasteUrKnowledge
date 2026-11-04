import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { logoUrlFor } from "@/lib/school-logo";
import { SchoolHeader } from "@/components/SchoolHeader";

/**
 * The top of every teacher page: the school's logo, if it has one, beside its
 * name, then the teacher's name in bold with (T) for Teacher, and an optional
 * line about the page.
 */
export async function TeacherHeader({ userId, line }: { userId: number; line?: string }) {
  const me = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: {
      fName: true,
      mName: true,
      lName: true,
      school: { select: { id: true, name: true, logoUpdatedAt: true } },
    },
  });

  const school = me?.school;
  const logoUrl = school ? logoUrlFor(school.id, school.logoUpdatedAt) : null;

  return (
    <SchoolHeader
      schoolName={school?.name ?? ""}
      logoUrl={logoUrl}
      person={`${me ? displayName(me) : ""} (T)`}
      line={line}
    />
  );
}
