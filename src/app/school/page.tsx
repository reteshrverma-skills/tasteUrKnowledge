import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { listPupils, listYears, requireSchoolStaff } from "@/lib/school";
import { logoUrlFor } from "@/lib/school-logo";
import { PERSON_NAME_CLASS, SCHOOL_NAME_CLASS } from "@/components/SchoolLogo";
import { BrandLogo } from "@/components/BrandLogo";
import { HelpMenu } from "@/components/HelpMenu";
import { LogoutButton } from "@/components/LogoutButton";
import {
  AddPupilForm,
  AssignTeacherForm,
  CreateTeacherForm,
  EditPupilForm,
  EditTeacherForm,
  ParentLinkForm,
  PupilListItem,
  SchoolLogoEditor,
  TeacherListItem,
} from "@/components/SchoolForms";

const TABS = [
  { key: "teachers", label: "Teachers" },
  { key: "pupils", label: "Pupils" },
  //{ key: "years", label: "Years" },
] as const;

type Tab = (typeof TABS)[number]["key"];

/**
 * The School Admin's home, full width. Tabs along the top; under each, the
 * list on the left (35%) and the add/edit frame on the right (65%). Edit in
 * the list opens that row in the right frame (?edit=id); Save or Cancel goes
 * back to the add form. On a narrow screen the two stack.
 *
 * A school's classes are the Years; pupils are opened for practice by their
 * teacher, not from here.
 */
export default async function SchoolPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; edit?: string }>;
}) {
  const staff = await requireSchoolStaff(["SCHOOL_ADMIN"]).catch(() => null);
  if (!staff) redirect("/login");

  const { tab: requested, edit } = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === requested) ? (requested as Tab) : "teachers";

  const [me, school, teachers, years] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: staff.userId },
      select: { fName: true, mName: true, lName: true },
    }),
    prisma.school.findUnique({
      where: { id: staff.schoolId },
      select: { name: true, maxStudents: true, logoUpdatedAt: true },
    }),
    prisma.userProfile.findMany({
      where: { schoolId: staff.schoolId, userType: "TEACHER" },
      orderBy: [{ fName: "asc" }, { lName: "asc" }],
      select: {
        id: true,
        fName: true,
        mName: true,
        lName: true,
        profileName: true,
        isActive: true,
        personalDetails: { select: { emailAddress: true } },
        classesTaught: {
          where: { removedAt: null },
          select: { classId: true, masterClass: { select: { name: true, order: true } } },
        },
      },
    }),
    listYears(staff),
  ]);
  const pupilCount = years.reduce((sum, y) => sum + y.studentCount, 0);
  const pupils =
    tab === "pupils"
      ? await listPupils(staff, years.map((y) => y.id), { includeInactive: true })
      : [];

  const yearOptions = years.map((y) => ({ id: y.id, label: y.name }));
  const teacherOptions = teachers
    .filter((t) => t.isActive)
    .map((t) => ({ id: Number(t.id), label: displayName(t) }));

  const tabHref = `/school?tab=${tab}`;
  const editHref = (id: number) => `${tabHref}&edit=${id}`;
  const editing = Number(edit) || null;
  const editingTeacher =
    tab === "teachers" ? teachers.find((t) => Number(t.id) === editing) : undefined;
  const editingPupil = tab === "pupils" ? pupils.find((p) => p.studentId === editing) : undefined;

  const teacherDetails = (t: (typeof teachers)[number]) => ({
    id: Number(t.id),
    fName: t.fName ?? "",
    lName: t.lName ?? "",
    email: t.personalDetails?.emailAddress ?? "",
    profileName: t.profileName,
    isActive: t.isActive,
    yearIds: t.classesTaught.map((c) => c.classId),
  });

  const panel = "card p-6 sm:p-8";
  // Side by side, the list sits on the left and the form on the right; on a
  // narrow screen they stack in source order, form first.
  const formPanel = `${panel} lg:order-2`;
  const listPanel = `${panel} lg:order-1`;
  const heading = "font-display text-lg font-semibold text-ink mb-4";

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
          <BrandLogo height={56} />
          <div className="flex items-center gap-4 shrink-0">
            <HelpMenu />
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <SchoolLogoEditor
          logoUrl={school ? logoUrlFor(staff.schoolId, school.logoUpdatedAt) : null}
        >
          <p className={`${SCHOOL_NAME_CLASS} text-2xl mb-1 sm:hidden`}>{school?.name}</p>
          <h1 className={PERSON_NAME_CLASS}>{me ? displayName(me) : ""} (School Admin)</h1>
          <p className="text-ink-soft mt-1">
            {teachers.length} teachers · {pupilCount}
            {school?.maxStudents != null && ` of ${school.maxStudents}`} pupils
          </p>
        </SchoolLogoEditor>

        {/* The tabs sit over the right-hand (form) column, on the same grid as
            the panels below; the line under them runs the full width. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] border-b border-line">
          <div className="flex gap-2 lg:col-start-2" role="tablist">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/school?tab=${t.key}`}
                role="tab"
                aria-selected={tab === t.key}
                className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition ${
                  tab === t.key
                    ? "border-brand text-brand"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Left 35%: the list. Right 65%: add or edit. */}
        {/* minmax(0, …) so a long email cannot widen a column past its share
            and push the list off the screen. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] items-start">
          {tab === "teachers" && (
            <>
              <section className={formPanel}>
                {editingTeacher ? (
                  <>
                    <h2 className={heading}>
                      Edit {editingTeacher.fName} {editingTeacher.lName}
                    </h2>
                    <EditTeacherForm
                      key={String(editingTeacher.id)}
                      teacher={teacherDetails(editingTeacher)}
                      years={yearOptions}
                      doneHref={tabHref}
                    />
                  </>
                ) : (
                  <>
                    <h2 className={heading}>Create a teacher</h2>
                    <CreateTeacherForm years={yearOptions} />
                  </>
                )}
              </section>
              <section className={listPanel}>
                <h2 className={heading}>Teachers ({teachers.length})</h2>
                {teachers.length === 0 ? (
                  <p className="text-sm text-ink-faint">No teachers yet.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {teachers.map((t) => (
                      <TeacherListItem
                        key={String(t.id)}
                        teacher={teacherDetails(t)}
                        yearNames={t.classesTaught
                          .map((c) => c.masterClass)
                          .sort((a, b) => a.order - b.order)
                          .map((y) => y.name)
                          .join(", ")}
                        years={yearOptions}
                        editHref={editHref(Number(t.id))}
                        selected={Number(t.id) === editing}
                      />
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {tab === "pupils" && (
            <>
              <section className={formPanel}>
                {editingPupil ? (
                  <>
                    <h2 className={heading}>Edit {editingPupil.name}</h2>
                    <EditPupilForm
                      key={editingPupil.studentId}
                      pupil={editingPupil}
                      years={yearOptions}
                      doneHref={tabHref}
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
              <section className={listPanel}>
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
                        years={yearOptions}
                        editHref={editHref(p.studentId)}
                        selected={p.studentId === editing}
                      />
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {/* The Years tab is switched off in TABS; kept laid out the same way. */}
          {(tab as string) === "years" && (
            <>
              <section className={formPanel}>
                <h2 className={heading}>Add a teacher to a year</h2>
                {teacherOptions.length > 0 ? (
                  <AssignTeacherForm years={yearOptions} teachers={teacherOptions} />
                ) : (
                  <p className="text-sm text-ink-faint">Create a teacher first.</p>
                )}
              </section>
              <section className={listPanel}>
                <h2 className={heading}>Years</h2>
                <ul className="divide-y divide-line">
                  {years.map((y) => (
                    <li key={y.id} className="py-2.5 flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm">
                      <span className="text-ink font-medium">{y.name}</span>
                      <span className="text-ink-soft">
                        {y.studentCount} pupils · {y.teachers.map((t) => t.name).join(", ") || "no teacher"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
