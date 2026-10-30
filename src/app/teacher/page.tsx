import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listPupils, listYears, requireSchoolStaff } from "@/lib/school";
import { PupilGrid } from "./PupilGrid";
import { PupilPerformance } from "./PupilPerformance";
import { TeacherNav } from "./TeacherNav";

/**
 * The teacher's dashboard: the pupils of the Years they take. Clicking a pupil
 * hands this device to them for practice; their turn ends with the teacher's
 * PIN. A teacher may be signed in on any number of classroom devices at once.
 * Below, Performance lists the pupils by name, each opening their progress.
 * Managing pupils and the PIN are in the Profile menu.
 */
export default async function TeacherPage() {
  const staff = await requireSchoolStaff(["TEACHER"]).catch(() => null);
  if (!staff) redirect("/login");

  const [years, me] = await Promise.all([
    listYears(staff),
    prisma.userProfile.findUnique({
      where: { id: staff.userId },
      select: { fName: true, school: { select: { name: true } } },
    }),
  ]);
  const pupils = await listPupils(staff, years.map((y) => y.id));
  const yearOptions = years.map((y) => ({ id: y.id, label: y.name }));

  return (
    <div className="min-h-screen bg-ground">
      <TeacherNav userId={staff.userId} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Hello{me?.fName ? `, ${me.fName}` : ""}
          </h1>
          <p className="text-ink-soft mt-1">
            {me?.school?.name} · Click a pupil to start their practice on this device.
          </p>
        </header>

        {years.length === 0 ? (
          <section className="card p-6 sm:p-8">
            <p className="text-sm text-ink-soft">
              You are not on any year yet. Ask your School Admin to add you to one.
            </p>
          </section>
        ) : (
          <>
            <PupilGrid years={yearOptions} pupils={pupils} />
            <PupilPerformance pupils={pupils} />
          </>
        )}
      </main>
    </div>
  );
}
