import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { SchoolHeader } from "@/components/SchoolHeader";

/**
 * The top of every teacher page: the school's name, then the teacher's name
 * with (T) for Teacher, and an optional line about the page.
 */
export async function TeacherHeader({ userId, line }: { userId: number; line?: string }) {
  const me = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: {
      fName: true,
      mName: true,
      lName: true,
      school: { select: { name: true } },
    },
  });

  return (
    <SchoolHeader
      schoolName={me?.school?.name ?? ""}
      person={`${me ? displayName(me) : ""} (T)`}
      line={line}
    />
  );
}
