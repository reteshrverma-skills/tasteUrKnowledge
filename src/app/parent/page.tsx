import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { listChildren, parentProfile } from "@/lib/parent";
import { difficultyStyle } from "@/lib/student";
import { skillBreakdown, timeSpentBySubject } from "@/lib/progress";
import { ParentNav } from "./ParentNav";
import { ChildProgress } from "./ChildProgress";

/**
 * Where a parent lands after logging in.
 *
 * A parent's job here is their children, so the page is the Kids list: who
 * they are, what year they are in and what is unlocked, with the way to add
 * another right there. Their own details sit behind Profile in the bar above.
 */
export default async function ParentDashboardPage() {
  const session = await getSession();
  // The proxy already guards /parent, but a page that reads a parent's
  // children must not depend on that alone.
  if (!session || session.userType !== "PARENT") redirect("/login");

  const profile = await parentProfile(session.userId);
  const parentName = profile ? displayName(profile) : "Parent";
  const children = await listChildren(session.userId);

  // Each child's figures are fetched alongside the others rather than one
  // after another, so a parent with several children does not wait n times.
  const progress = await Promise.all(
    children.map(async (child) => {
      const [times, skills] = await Promise.all([
        timeSpentBySubject(child.studentId),
        skillBreakdown(child.studentId),
      ]);
      return { studentId: child.studentId, times, skills };
    })
  );
  const progressById = new Map(progress.map((p) => [p.studentId, p]));

  return (
    <div className="min-h-screen bg-ground">
      <ParentNav parentName={parentName} />

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">
            Welcome, {parentName}
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            {children.length === 0
              ? "Add your first child to get started"
              : `You are looking after ${children.length} ${
                  children.length === 1 ? "child" : "children"
                }`}
          </p>
        </header>

        {children.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              No children on your account yet
            </p>
            <p className="text-ink-soft text-sm mt-1.5 max-w-sm mx-auto">
              Create a profile for your child and they will be able to log in
              and start practising.
            </p>
            <Link href="/parent/kids" className="btn-primary inline-block mt-6 px-5 py-2.5">
              Add a child
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {children.map((child) => (
                <div key={child.studentId} className="card px-5 sm:px-6 py-5">
                  <div className="flex items-center gap-4 flex-wrap">
                  <span className="w-11 h-11 rounded-full bg-brand-tint text-brand grid place-items-center font-display font-semibold shrink-0">
                    {child.name.charAt(0).toUpperCase()}
                  </span>

                  <div className="min-w-0">
                    <p className="font-display font-semibold text-ink truncate flex items-center gap-2">
                      {child.name}
                      {!child.isActive && (
                        <span className="chip bg-ground text-ink-soft border-line-strong">
                          Inactive
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      {child.profileName}
                      {child.yearName ? ` · ${child.yearName}` : ""}
                    </p>
                  </div>

                  <span className="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
                    {child.levels.length === 0 ? (
                      <span className="chip bg-warm-tint text-warm border-warm/25">
                        No levels unlocked
                      </span>
                    ) : (
                      child.levels.map((level) => (
                        <span
                          key={level}
                          className={`chip ${difficultyStyle(level)}`}
                        >
                          {level}
                        </span>
                      ))
                    )}
                    <Link
                      href={`/parent/kids/${child.studentId}`}
                      className="btn-quiet ml-1 px-3 py-1.5 text-xs whitespace-nowrap"
                    >
                      Edit
                    </Link>
                  </span>
                  </div>

                  <ChildProgress
                    times={progressById.get(child.studentId)?.times ?? []}
                    strengths={
                      progressById.get(child.studentId)?.skills.strengths ?? []
                    }
                    weaknesses={
                      progressById.get(child.studentId)?.skills.weaknesses ?? []
                    }
                  />
                </div>
              ))}
            </div>

            <Link
              href="/parent/kids"
              className="btn-quiet inline-block mt-5 px-4 py-2.5 text-sm"
            >
              + Add another child
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
