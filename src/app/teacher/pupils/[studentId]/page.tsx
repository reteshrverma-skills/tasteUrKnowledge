import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { pupilFor, requireSchoolStaff } from "@/lib/school";
import { timeSpentBySubject } from "@/lib/progress";
import { ChildProgress } from "../../../parent/ChildProgress";
import { TeacherNav } from "../../TeacherNav";
import { pupilSubjectHref } from "../../links";

/**
 * One pupil's performance, opened from Performance on the teacher dashboard:
 * time spent per subject, as a parent sees their child, with Details opening
 * each subject's focus areas, topic scores and latest tests.
 */
export default async function TeacherPupilPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const staff = await requireSchoolStaff(["TEACHER"]).catch(() => null);
  if (!staff) redirect("/login");

  const { studentId: raw } = await params;
  const studentId = Number(raw);
  // A pupil outside this teacher's Years is simply not there for them.
  if (!Number.isInteger(studentId) || studentId <= 0) notFound();
  if (!(await pupilFor(staff, BigInt(studentId)))) notFound();

  const [pupil, times] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: studentId },
      select: {
        fName: true,
        mName: true,
        lName: true,
        studentDetails: { select: { year: { select: { name: true } } } },
      },
    }),
    timeSpentBySubject(studentId),
  ]);
  if (!pupil) notFound();
  const name = displayName(pupil);

  return (
    <div className="min-h-screen bg-ground">
      <TeacherNav userId={staff.userId} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-5">
        <Link href="/teacher" className="text-sm font-medium text-ink-soft hover:text-brand transition">
          ← Back to dashboard
        </Link>

        <section className="card px-5 sm:px-6 py-5">
          <div className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-full bg-brand-tint text-brand grid place-items-center font-display font-semibold shrink-0">
              {name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-ink text-lg truncate">{name}</h1>
              <p className="text-xs text-ink-faint mt-0.5">{pupil.studentDetails?.year?.name}</p>
            </div>
          </div>
          <ChildProgress studentId={studentId} times={times} detailsHref={pupilSubjectHref} />
        </section>
      </main>
    </div>
  );
}
