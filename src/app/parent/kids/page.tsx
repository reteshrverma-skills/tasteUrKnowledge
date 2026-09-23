import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { listChildren, listYears, parentProfile } from "@/lib/parent";
import { ParentNav } from "../ParentNav";
import { AddKidForm } from "./AddKidForm";

/** Kids Profile: every child on the account, and the form to add another. */
export default async function KidsProfilePage() {
  const session = await getSession();
  if (!session || session.userType !== "PARENT") redirect("/login");

  const profile = await parentProfile(session.userId);
  const parentName = profile ? displayName(profile) : "Parent";
  const [children, years] = await Promise.all([
    listChildren(session.userId),
    listYears(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ParentNav parentName={parentName} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/parent"
          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Kids Profile</h2>
          <p className="text-gray-600 mt-1">
            Each child gets their own login and practises as themselves.
          </p>
        </div>

        {children.length > 0 && (
          <div className="mb-8 space-y-2">
            {children.map((child) => (
              <Link
                key={child.studentId}
                href={`/parent/kids/${child.studentId}`}
                className="flex items-center gap-3 bg-white rounded-lg shadow-sm hover:shadow-md transition px-4 py-3 border-l-4 border-indigo-500"
              >
                <span className="font-semibold text-gray-800">
                  {child.name}
                </span>
                <span className="text-xs text-gray-500">
                  {child.profileName}
                  {child.yearName ? ` · ${child.yearName}` : " · no year set"}
                </span>
                <span className="ml-auto text-xs font-bold text-indigo-600">
                  Edit →
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            Add a child
          </h3>
          <p className="text-sm text-gray-600 mb-5">
            {years.length === 0
              ? "No school years have been set up yet, so a child cannot be given one."
              : "Your child will sign in with the login id you choose here."}
          </p>
          <AddKidForm years={years} />
        </div>
      </div>
    </div>
  );
}
