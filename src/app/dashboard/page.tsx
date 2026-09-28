import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SUBJECT_ORDER, displayName } from "@/lib/english";
import { MATHS_SUBJECT_NAME } from "@/lib/maths";
import { NVR_SUBJECT_NAME } from "@/lib/nvr";
import Link from "next/link";

/**
 * One mark per subject, so a child recognises where they are going before
 * reading the word. Flat colour rather than a gradient: four gradients side by
 * side compete with each other and with the difficulty chips further in.
 */
const SUBJECT_STYLES: Record<
  string,
  { bar: string; glyph: string; mark: string }
> = {
  English: {
    bar: "bg-master",
    glyph: "bg-master-tint text-master",
    mark: "Aa",
  },
  Maths: {
    bar: "bg-explorer",
    glyph: "bg-explorer-tint text-explorer",
    mark: "7+3",
  },
  Verbal: {
    bar: "bg-starter",
    glyph: "bg-starter-tint text-starter",
    mark: "“”",
  },
  "Non-Verbal": {
    bar: "bg-challenger",
    glyph: "bg-challenger-tint text-challenger",
    mark: "◧",
  },
};

const FALLBACK_STYLE = {
  bar: "bg-ink-faint",
  glyph: "bg-ground text-ink-soft",
  mark: "?",
};

export default async function DashboardPage() {
  // Middleware handles authentication, so we can safely proceed
  const session = await getSession();
  const isAdmin = session?.userType === "ADMIN";

  const profile = session
    ? await prisma.userProfile.findUnique({
        where: { id: session.userId },
        select: {
          fName: true,
          mName: true,
          lName: true,
          profileName: true,
          userType: true,
        },
      })
    : null;

  const studentName = profile ? displayName(profile) : "Student";

  // Subjects come from the Subject table, but the four canonical ones are
  // always shown so a student never lands on an empty page.
  const subjectRows = await prisma.subject.findMany({
    select: { name: true },
    distinct: ["name"],
    orderBy: { order: "asc" },
  });

  const subjectNames = Array.from(
    new Set([...SUBJECT_ORDER, ...subjectRows.map((s) => s.name)])
  );

  // Comprehensions are no longer filed by year - difficulty level alone
  // decides what a student may open - so every comprehension counts here.
  const compCounts = await prisma.gsEnglishComp.groupBy({
    by: ["subjectName"],
    _count: { _all: true },
  });

  // Maths and Non-Verbal each live in their own table, counted as questions
  // rather than comprehensions. A subject missing from here reads as "Coming
  // soon" however much content it actually has, which is what hid Non-Verbal.
  const [mathsCount, nvrCount] = await Promise.all([
    prisma.gsMathsQuestion.count(),
    prisma.gsNvrQuestion.count(),
  ]);

  const countFor = (name: string) => {
    if (name.toLowerCase() === MATHS_SUBJECT_NAME.toLowerCase()) {
      return mathsCount;
    }
    if (name.toLowerCase() === NVR_SUBJECT_NAME.toLowerCase()) {
      return nvrCount;
    }
    return (
      compCounts.find(
        (row) => row.subjectName?.toLowerCase() === name.toLowerCase()
      )?._count._all ?? 0
    );
  };

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3.5 flex justify-between items-center gap-4">
          <span className="font-display text-lg font-bold text-brand">
            TasteUrKnowledge
          </span>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="btn-quiet px-3.5 py-1.5 text-sm"
              >
                Admin
              </Link>
            )}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm font-medium text-ink-soft hover:text-poor transition"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="mb-9 flex items-center gap-4">
          <span className="w-12 h-12 rounded-full bg-brand text-white grid place-items-center font-display text-lg font-semibold shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">
              Hello, {studentName}
            </h1>
            <p className="text-ink-soft text-sm mt-0.5">
              Pick a subject to start practising
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectNames.map((name) => {
            const style = SUBJECT_STYLES[name] ?? FALLBACK_STYLE;
            const count = countFor(name);
            // Maths and Non-Verbal are banks of individual questions;
            // English is a shelf of comprehensions. The tile counts whichever
            // the subject actually holds.
            const countsQuestions =
              name.toLowerCase() === MATHS_SUBJECT_NAME.toLowerCase() ||
              name.toLowerCase() === NVR_SUBJECT_NAME.toLowerCase();
            const ready = count > 0;

            return (
              <Link
                key={name}
                href={`/dashboard/subject/${encodeURIComponent(name)}`}
                aria-disabled={!ready}
                className={`card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${
                  ready ? "" : "opacity-60"
                }`}
              >
                {/* A single colour bar carries the subject's identity */}
                <span
                  className={`absolute inset-x-0 top-0 h-1 ${style.bar}`}
                  aria-hidden="true"
                />

                <span
                  className={`w-11 h-11 rounded-xl grid place-items-center font-display font-semibold text-sm mb-4 ${style.glyph}`}
                  aria-hidden="true"
                >
                  {style.mark}
                </span>

                <h2 className="font-display text-lg font-semibold text-ink group-hover:text-brand transition">
                  {name}
                </h2>

                <p className="text-sm text-ink-soft mt-1 tabular">
                  {!ready
                    ? "Coming soon"
                    : countsQuestions
                    ? `${count.toLocaleString()} questions`
                    : `${count} comprehension${count === 1 ? "" : "s"}`}
                </p>

                {ready && (
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                    Start
                    <span
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
