import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listPupils, listYears, requireSchoolStaff } from "@/lib/school";
import { BrandLogo } from "@/components/BrandLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { SetPinForm } from "@/components/SchoolForms";
import { PupilGrid } from "./PupilGrid";

/**
 * The teacher's dashboard: the pupils of the Years they take. Tapping a pupil
 * hands this device to them for practice; their turn ends with the teacher's
 * PIN. A teacher may be signed in on any number of classroom devices at once.
 * Adding and editing pupils is on /teacher/pupils, next to Log out.
 */
export default async function TeacherPage() {
  const staff = await requireSchoolStaff(["TEACHER"]).catch(() => null);
  if (!staff) redirect("/login");

  const [years, me] = await Promise.all([
    listYears(staff),
    prisma.userProfile.findUnique({
      where: { id: staff.userId },
      select: { fName: true, pinHash: true, school: { select: { name: true } } },
    }),
  ]);
  const pupils = await listPupils(staff, years.map((y) => y.id));
  const yearOptions = years.map((y) => ({ id: y.id, label: y.name }));

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <span className="justify-self-start text-sm font-medium text-ink-soft">Teacher</span>
          <BrandLogo height={56} />
          <div className="justify-self-end flex items-center gap-5">
            <Link href="/teacher/pupils" className="text-sm font-medium text-brand hover:underline">
              Manage pupils
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Hello{me?.fName ? `, ${me.fName}` : ""}
          </h1>
          <p className="text-ink-soft mt-1">
            {me?.school?.name} · Tap a pupil to start their practice on this device.
          </p>
        </header>

        {years.length === 0 ? (
          <section className="card p-6 sm:p-8">
            <p className="text-sm text-ink-soft">
              You are not on any year yet. Ask your School Admin to add you to one.
            </p>
          </section>
        ) : (
          <PupilGrid years={yearOptions} pupils={pupils} />
        )}

        <section className="card p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Your PIN</h2>
          <SetPinForm hasPin={Boolean(me?.pinHash)} />
        </section>
      </main>
    </div>
  );
}
