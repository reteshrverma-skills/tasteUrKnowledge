import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { listYears, ownsChild, parentProfile } from "@/lib/parent";
import { ParentNav } from "../../ParentNav";
import { EditKidForm } from "./EditKidForm";

/** One child's profile, editable by the parent who owns it. */
export default async function EditKidPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await getSession();
  if (!session || session.userType !== "PARENT") redirect("/login");

  const { studentId: raw } = await params;
  const studentId = Number(raw);

  // A child belonging to someone else is not "forbidden", it simply is not
  // there as far as this parent is concerned.
  if (!Number.isInteger(studentId)) notFound();
  if (!(await ownsChild(session.userId, studentId))) notFound();

  const [child, years, profile] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: studentId },
      select: {
        fName: true,
        mName: true,
        lName: true,
        profileName: true,
        isActive: true,
        studentDetails: { select: { studentYear: true } },
      },
    }),
    listYears(),
    parentProfile(session.userId),
  ]);

  if (!child) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ParentNav parentName={profile ? displayName(profile) : "Parent"} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/parent/kids"
          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
        >
          ← Back to Kids Profile
        </Link>

        <div className="mt-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            {displayName(child)}
          </h2>
          <p className="text-gray-600 mt-1">
            Login id{" "}
            <span className="font-semibold text-gray-800">
              {child.profileName}
            </span>{" "}
            — this cannot be changed.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <EditKidForm
            studentId={studentId}
            years={years}
            initial={{
              fName: child.fName ?? "",
              mName: child.mName ?? "",
              lName: child.lName ?? "",
              studentYear: child.studentDetails?.studentYear ?? "",
              isActive: child.isActive,
            }}
          />
        </div>
      </div>
    </div>
  );
}
