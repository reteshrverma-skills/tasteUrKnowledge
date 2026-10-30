import Link from "next/link";
import { redirect } from "next/navigation";
import { listPupils, listYears, requireSchoolStaff } from "@/lib/school";
import { BrandLogo } from "@/components/BrandLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { AddPupilForm, PupilListItem } from "@/components/SchoolForms";

/**
 * Teacher: add pupils to the Years they take and edit them. Inactive pupils
 * are listed too, so they can be switched back on. Kept off the dashboard so
 * the dashboard stays a plain grid of pupils to tap.
 */
export default async function TeacherPupilsPage() {
  const staff = await requireSchoolStaff(["TEACHER"]).catch(() => null);
  if (!staff) redirect("/login");

  const years = await listYears(staff);
  const pupils = await listPupils(staff, years.map((y) => y.id), { includeInactive: true });
  const yearOptions = years.map((y) => ({ id: y.id, label: y.name }));

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link href="/teacher" className="justify-self-start text-sm font-medium text-ink-soft hover:text-brand">
            ← Dashboard
          </Link>
          <BrandLogo height={56} />
          <div className="justify-self-end">
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Manage pupils</h1>
        </header>

        {yearOptions.length === 0 ? (
          <section className="card p-6 sm:p-8">
            <p className="text-sm text-ink-soft">
              You are not on any year yet. Ask your School Admin to add you to one.
            </p>
          </section>
        ) : (
          <>
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">Add a pupil</h2>
              <AddPupilForm years={yearOptions} />
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">
                Pupils ({pupils.length})
              </h2>
              {pupils.length === 0 ? (
                <p className="text-sm text-ink-faint">No pupils yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {pupils.map((p) => (
                    <PupilListItem
                      key={p.studentId}
                      pupil={p}
                      yearName={p.yearName}
                      inSession={p.inSession}
                      years={yearOptions}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
