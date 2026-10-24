import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { programmeOf } from "@/lib/programme";
import { difficultyStyle } from "@/lib/level-style";
import { availableNvrLevels, nvrTopicsForLevel } from "@/lib/nvr";
import { LevelIcon } from "@/app/dashboard/subject/LevelIcon";
import { LogoutButton } from "@/components/LogoutButton";

/**
 * Admin view of the Non-Verbal bank: difficulty chips at the top, then each
 * topic at that level. A topic opens its questions with the answer key.
 */
export default async function AdminNvrPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const session = await getSession();
  // Only this programme's content: Grammar School, GCSE or A-Level.
  const programme = programmeOf(session);
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const { level: requestedLevel } = await searchParams;

  // Every level with questions behind it - the admin is not gated by level.
  const levels = await availableNvrLevels(programme);
  const activeLevel =
    levels.find((l) => l.toLowerCase() === requestedLevel?.toLowerCase()) ??
    levels[0];

  const topics = activeLevel ? await nvrTopicsForLevel(programme, activeLevel) : [];

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/admin"
            className="text-brand hover:text-brand-hover font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-brand">
            Non-Verbal Reasoning
          </h1>
          <LogoutButton />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {levels.length === 0 ? (
          <div className="card p-12 text-center text-ink-soft">
            No Non-Verbal questions in the bank yet.
          </div>
        ) : (
          <>
            <div>
              <h2 className="eyebrow mb-2.5">Difficulty level</h2>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => {
                  const isActive = level === activeLevel;
                  return (
                    <Link
                      key={level}
                      href={`/admin/nvr?level=${encodeURIComponent(level)}`}
                      aria-current={isActive ? "true" : undefined}
                      className={`chip chip-lg border transition inline-flex items-center gap-1.5 ${
                        isActive
                          ? "bg-brand text-white border-brand shadow-sm"
                          : `${difficultyStyle(level)} hover:brightness-[0.97]`
                      }`}
                    >
                      <LevelIcon level={level} />
                      {level}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="eyebrow mb-2.5">Topic</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topics.map((topic) => (
                  <Link
                    key={topic.topic}
                    href={`/admin/nvr/topic?${new URLSearchParams({
                      level: activeLevel,
                      topic: topic.topic,
                    })}`}
                    className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-semibold text-ink group-hover:text-brand transition">
                        {topic.topic}
                      </h3>
                      <span className="text-xs text-ink-faint tabular shrink-0">
                        {topic.count} question{topic.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-ink-soft text-sm mt-1.5">
                      {topic.subTopics.map((s) => s.subTopic).join(" · ")}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
