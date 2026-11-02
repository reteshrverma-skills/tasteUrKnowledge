import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSchoolStaff } from "@/lib/school";
import { SetPinForm } from "@/components/SchoolForms";
import { TeacherHeader } from "../TeacherHeader";
import { TeacherNav } from "../TeacherNav";

/** Teacher: set the 4-digit PIN that ends a pupil's turn on a classroom device. */
export default async function TeacherPinPage() {
  const staff = await requireSchoolStaff(["TEACHER"]).catch(() => null);
  if (!staff) redirect("/login");

  const me = await prisma.userProfile.findUnique({
    where: { id: staff.userId },
    select: { pinHash: true },
  });

  return (
    <div className="min-h-screen bg-ground">
      <TeacherNav userId={staff.userId} />

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <Link href="/teacher" className="text-sm font-medium text-ink-soft hover:text-brand transition">
          ← Back to dashboard
        </Link>
        <TeacherHeader userId={staff.userId} />
        <section className="card p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Your PIN</h2>
          <SetPinForm hasPin={Boolean(me?.pinHash)} />
        </section>
      </main>
    </div>
  );
}
