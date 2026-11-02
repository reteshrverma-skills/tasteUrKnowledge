import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listPupils, listYears, requireSchoolStaff } from "@/lib/school";
import {
  AddPupilForm,
  EditPupilForm,
  ParentLinkForm,
  PupilListItem,
} from "@/components/SchoolForms";
import { TeacherHeader } from "../TeacherHeader";
import { TeacherNav } from "../TeacherNav";

const BASE_HREF = "/teacher/pupils";

/**
 * Teacher: add pupils to the Years they take and edit them, laid out like the
 * School Admin's page - full width, the list on the left (35%) and the add/edit
 * frame on the right (65%). Edit in the list opens that row in the right frame
 * (?edit=id); Save or Cancel goes back to the add form. On a narrow screen the
 * two stack, form first.
 *
 * Inactive pupils are listed too, so they can be switched back on. Kept off the
 * dashboard so the dashboard stays a plain grid of pupils to click.
 */
export default async function TeacherPupilsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const staff = await requireSchoolStaff(["TEACHER"]).catch(() => null);
  if (!staff) redirect("/login");

  const { edit } = await searchParams;

  const [years, allYears] = await Promise.all([
    listYears(staff),
    prisma.year.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);
  const pupils = await listPupils(staff, years.map((y) => y.id), { includeInactive: true });
  const yearOptions = years.map((y) => ({ id: y.id, label: y.name }));
  // Editing may move a pupil to any Year; adding stays within the teacher's own.
  const moveOptions = allYears.map((y) => ({ id: y.id, label: y.name }));

  const editing = Number(edit) || null;
  const editingPupil = pupils.find((p) => p.studentId === editing);

  const panel = "card p-6 sm:p-8";
  const heading = "font-display text-lg font-semibold text-ink mb-4";

  return (
    <div className="min-h-screen bg-ground">
      <TeacherNav userId={staff.userId} />

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <Link href="/teacher" className="text-sm font-medium text-ink-soft hover:text-brand transition">
          ← Back to dashboard
        </Link>
        <TeacherHeader userId={staff.userId} line={`Manage pupils · ${pupils.length} pupils`} />

        {yearOptions.length === 0 ? (
          <section className={panel}>
            <p className="text-sm text-ink-soft">
              You are not on any year yet. Ask your School Admin to add you to one.
            </p>
          </section>
        ) : (
          // Left 35%: the list. Right 65%: add or edit. minmax(0, …) so a long
          // name cannot widen a column past its share.
          <div className="grid gap-6 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] items-start">
            <section className={`${panel} lg:order-2`}>
              {editingPupil ? (
                <>
                  <h2 className={heading}>Edit {editingPupil.name}</h2>
                  <EditPupilForm
                    key={editingPupil.studentId}
                    pupil={editingPupil}
                    years={moveOptions}
                    doneHref={BASE_HREF}
                  />
                  <ParentLinkForm key={`parent-${editingPupil.studentId}`} pupil={editingPupil} />
                </>
              ) : (
                <>
                  <h2 className={heading}>Add a pupil</h2>
                  <AddPupilForm years={yearOptions} />
                </>
              )}
            </section>

            <section className={`${panel} lg:order-1`}>
              <h2 className={heading}>Pupils ({pupils.length})</h2>
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
                      years={moveOptions}
                      editHref={`${BASE_HREF}?edit=${p.studentId}`}
                      selected={p.studentId === editing}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
