import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { listChildren, parentProfile } from "@/lib/parent";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ParentNav parentName={parentName} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome, {parentName}
          </h2>
          <p className="text-gray-600 mt-1">
            {children.length === 0
              ? "Add your first child to get started"
              : `You are looking after ${children.length} ${
                  children.length === 1 ? "child" : "children"
                }`}
          </p>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-800 text-lg font-medium">
              No children on your account yet
            </p>
            <p className="text-gray-600 mt-2">
              Create a profile for your child and they will be able to log in
              and start practising.
            </p>
            <Link
              href="/parent/kids"
              className="inline-block mt-6 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition"
            >
              Add a child
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {children.map((child) => (
                <div
                  key={child.studentId}
                  className="bg-white rounded-lg shadow-sm border-l-4 border-indigo-500 px-5 py-4"
                >
                  <div className="flex items-center gap-4 flex-wrap">
                  <span className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                    {child.name.charAt(0).toUpperCase()}
                  </span>

                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                      {child.name}
                      {!child.isActive && (
                        <span className="ml-2 px-2 py-0.5 text-[11px] font-bold rounded bg-gray-100 text-gray-600 border border-gray-300">
                          Inactive
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Login: {child.profileName}
                      {child.yearName ? ` · ${child.yearName}` : ""}
                    </p>
                  </div>

                  <span className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                    {child.levels.length === 0 ? (
                      <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded font-medium">
                        No levels unlocked
                      </span>
                    ) : (
                      child.levels.map((level) => (
                        <span
                          key={level}
                          className="px-2 py-0.5 text-[11px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                        >
                          {level}
                        </span>
                      ))
                    )}
                    <Link
                      href={`/parent/kids/${child.studentId}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition whitespace-nowrap"
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
              className="inline-block mt-6 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition"
            >
              + Add another child
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
