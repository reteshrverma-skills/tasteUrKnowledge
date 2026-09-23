import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SUBJECT_ORDER, displayName } from "@/lib/english";
import { MATHS_SUBJECT_NAME } from "@/lib/maths";
import Link from "next/link";

/** Each subject gets its own colour so the four tiles stay distinguishable. */
const SUBJECT_STYLES: Record<string, { tile: string; accent: string }> = {
  English: {
    tile: "from-pink-500 to-rose-600",
    accent: "text-rose-700 bg-rose-50 border-rose-200",
  },
  Maths: {
    tile: "from-blue-500 to-indigo-600",
    accent: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
  Verbal: {
    tile: "from-green-500 to-emerald-600",
    accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  "Non-Verbal": {
    tile: "from-amber-500 to-orange-600",
    accent: "text-orange-700 bg-orange-50 border-orange-200",
  },
};

const FALLBACK_STYLE = {
  tile: "from-gray-500 to-gray-600",
  accent: "text-gray-700 bg-gray-50 border-gray-200",
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

  // Maths lives in its own table and is not year-scoped.
  const mathsCount = await prisma.gsMathsQuestion.count();

  const countFor = (name: string) => {
    if (name.toLowerCase() === MATHS_SUBJECT_NAME.toLowerCase()) {
      return mathsCount;
    }
    return (
      compCounts.find(
        (row) => row.subjectName?.toLowerCase() === name.toLowerCase()
      )?._count._all ?? 0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">TasteUrKnowledge</h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                href="/admin"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
              >
                Admin Panel
              </Link>
            )}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-gray-600 hover:text-red-600 font-medium"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Student name */}
        <div className="mb-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{studentName}</h2>
            <p className="text-gray-600 mt-1">
              Choose a subject to start practising
            </p>
          </div>
        </div>

        {/* Subjects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjectNames.map((name) => {
            const style = SUBJECT_STYLES[name] ?? FALLBACK_STYLE;
            const count = countFor(name);
            const isMaths =
              name.toLowerCase() === MATHS_SUBJECT_NAME.toLowerCase();

            return (
              <Link
                key={name}
                href={`/dashboard/subject/${encodeURIComponent(name)}`}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden group"
              >
                <div
                  className={`bg-gradient-to-r ${style.tile} px-6 py-8 transition group-hover:brightness-110`}
                >
                  <h3 className="text-2xl font-bold text-white">{name}</h3>
                </div>
                <div className="p-5">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-bold rounded border ${style.accent}`}
                  >
                    {count === 0
                      ? "Coming soon"
                      : isMaths
                      ? `${count} questions`
                      : `${count} quiz${count === 1 ? "" : "zes"}`}
                  </span>
                  <p className="text-gray-600 mt-3 text-sm">
                    {count === 0 ? "No quizzes yet" : "Click to begin →"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
