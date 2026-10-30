import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSchoolStaff } from "@/lib/school";
import { SetPinForm } from "@/components/SchoolForms";
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-5">
        <Link href="/teacher" className="text-sm font-medium text-ink-soft hover:text-brand transition">
          ← Back to dashboard
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Your PIN</h1>
        <section className="card p-6 sm:p-8">
          <SetPinForm hasPin={Boolean(me?.pinHash)} />
        </section>
      </main>
    </div>
  );
}
