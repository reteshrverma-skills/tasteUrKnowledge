import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

/**
 * The old year/subject listing, kept only as a redirect.
 *
 * It rendered its own copy of the comprehension list and had drifted badly
 * from the one at /dashboard/subject/[subjectName]: no difficulty entitlement
 * check, so it showed passages the student had not been granted; still
 * filtered by school year, which no longer gates anything; and it advertised
 * the size of the question bank rather than the nine questions a round asks.
 *
 * Nothing links here any more, but the URL is reachable and Subject rows still
 * exist for it, so it redirects rather than 404s. One listing, one set of rules.
 */
export default async function LegacySubjectPage({
  params,
}: {
  params: Promise<{ yearId: string; subjectId: string }>;
}) {
  const { subjectId } = await params;

  const subject = subjectId
    ? await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { name: true },
      })
    : null;

  if (!subject) {
    notFound();
  }

  redirect(`/dashboard/subject/${encodeURIComponent(subject.name)}`);
}
