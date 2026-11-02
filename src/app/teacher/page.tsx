import { redirect } from "next/navigation";
import { listPupils, listYears, requireSchoolStaff } from "@/lib/school";
import { PupilGrid } from "./PupilGrid";
import { TeacherHeader } from "./TeacherHeader";
import { TeacherNav } from "./TeacherNav";

/**
 * The teacher's dashboard: the pupils of the Years they take. Test on a pupil
 * hands this device to them for practice; their turn ends with the teacher's
 * PIN. Result opens the pupil's progress. A teacher may be signed in on any
 * number of classroom devices at once. Managing pupils and the PIN are in the
 * Profile menu.
 */
export default async function TeacherPage() {
  const staff = await requireSchoolStaff(["TEACHER"]).catch(() => null);
  if (!staff) redirect("/login");

  const years = await listYears(staff);
  const pupils = await listPupils(staff, years.map((y) => y.id));
  const yearOptions = years.map((y) => ({ id: y.id, label: y.name }));

  return (
    <div className="min-h-screen bg-ground">
      <TeacherNav userId={staff.userId} />

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        <TeacherHeader
          userId={staff.userId}
          line="Test starts a pupil's practice on this device. Result shows their progress."
        />

        {years.length === 0 ? (
          <section className="card p-6 sm:p-8">
            <p className="text-sm text-ink-soft">
              You are not on any year yet. Ask your School Admin to add you to one.
            </p>
          </section>
        ) : (
          <PupilGrid years={yearOptions} pupils={pupils} />
        )}
      </main>
    </div>
  );
}
