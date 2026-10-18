import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APPROVED_COMP } from "@/lib/english";
import { allowedLevels, canAccessLevel } from "@/lib/student";
import { normaliseTopic } from "@/lib/progress-config";

/**
 * Any one of the passages richest in the focus type, so repeating the focus
 * does not replay the same story every time.
 */
function pickRichest(pool: [number, { count: number }][]): number | null {
  if (pool.length === 0) return null;
  const best = Math.max(...pool.map(([, c]) => c.count));
  const rich = pool.filter(([, c]) => c.count >= Math.min(3, best));
  return rich[Math.floor(Math.random() * rich.length)][0];
}

/**
 * Starts an English focus round: one question type, chosen by a parent.
 *
 * English rounds are built on a comprehension, so this picks one the child
 * may open that holds questions of that type - preferring the level they last
 * practised it at - and opens the quiz asking only those questions.
 */
export default async function EnglishFocusPage({
  params,
}: {
  params: Promise<{ focusId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const focusId = Number((await params).focusId);
  if (!Number.isSafeInteger(focusId) || focusId <= 0) notFound();

  const focus = await prisma.studentFocus.findFirst({
    where: {
      id: focusId,
      studentId: session.userId,
      clearedAt: null,
      subject: "English",
    },
    select: { topic: true, label: true, level: true },
  });
  if (!focus) notFound();

  const questionType = focus.topic ?? focus.label;
  const wanted = normaliseTopic(questionType);

  const [access, candidates] = await Promise.all([
    allowedLevels(session),
    // `contains` narrows the read; the exact match is made below.
    prisma.gsEnglishQuestion.findMany({
      where: {
        typeOfQuestion: { contains: questionType.trim(), mode: "insensitive" },
        comp: APPROVED_COMP,
      },
      select: {
        gsEngCompId: true,
        typeOfQuestion: true,
        comp: { select: { difficultyLevel: true } },
      },
    }),
  ]);

  // How many questions of this type each open comprehension holds.
  const counts = new Map<number, { count: number; level: string | null }>();
  for (const q of candidates) {
    if (!q.typeOfQuestion || normaliseTopic(q.typeOfQuestion) !== wanted) continue;
    if (!canAccessLevel(access, q.comp.difficultyLevel)) continue;
    const id = Number(q.gsEngCompId);
    const entry = counts.get(id) ?? { count: 0, level: q.comp.difficultyLevel };
    entry.count += 1;
    counts.set(id, entry);
  }

  const all = Array.from(counts.entries());
  const sameLevel = all.filter(
    ([, c]) => c.level?.toLowerCase() === focus.level?.toLowerCase()
  );
  const pool = sameLevel.length > 0 ? sameLevel : all;

  const compId = pickRichest(pool);
  if (compId !== null) {
    redirect(`/quiz/${compId}?type=${encodeURIComponent(questionType)}`);
  }

  return (
    <div className="min-h-screen bg-ground grid place-items-center px-5">
      <div className="card p-10 text-center max-w-md">
        <p className="font-display text-lg font-semibold text-ink">
          No {focus.label.toLowerCase()} questions available yet
        </p>
        <p className="text-ink-soft text-sm mt-1.5">
          There is nothing of this type at a level you can open. Try another
          English comprehension for now.
        </p>
        <Link
          href="/dashboard/subject/English"
          className="btn-primary inline-block mt-6 px-5 py-2.5"
        >
          Go to English
        </Link>
      </div>
    </div>
  );
}
