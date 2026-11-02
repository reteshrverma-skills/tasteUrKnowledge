import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";

/**
 * The top of every teacher page: the school's name, then the teacher's name
 * in bold with (T) for Teacher, and an optional line about the page.
 */
export async function TeacherHeader({ userId, line }: { userId: number; line?: string }) {
  const me = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { fName: true, mName: true, lName: true, school: { select: { name: true } } },
  });

  return (
    <header>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">{me?.school?.name}</h1>
      <p className="font-bold text-ink mt-1">{me ? displayName(me) : ""} (T)</p>
      {line && <p className="text-ink-soft mt-1">{line}</p>}
    </header>
  );
}
