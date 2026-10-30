import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { listPupils, listYears, requireSchoolStaff } from "@/lib/school";
import { BrandLogo } from "@/components/BrandLogo";
import { LogoutButton } from "@/components/LogoutButton";
import {
  AddPupilForm,
  AssignTeacherForm,
  CreateTeacherForm,
  PupilListItem,
  TeacherListItem,
} from "@/components/SchoolForms";

const TABS = [
  { key: "teachers", label: "Teachers" },
  { key: "pupils", label: "Pupils" },
  { key: "years", label: "Years" },
] as const;

type Tab = (typeof TABS)[number]["key"];

/**
 * The School Admin's home. Tabs along the top - Teachers, Pupils, Years -
 * each with its create form first and the list below. A school's classes are
 * the Years; pupils are opened for practice by their teacher, not from here.
 */
export default async function SchoolPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const staff = await requireSchoolStaff(["SCHOOL_ADMIN"]).catch(() => null);
  if (!staff) redirect("/login");

  const { tab: requested } = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === requested) ? (requested as Tab) : "teachers";

  const [school, teachers, years] = await Promise.all([
    prisma.school.findUnique({
      where: { id: staff.schoolId },
      select: { name: true, maxStudents: true },
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

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <span className="justify-self-start text-sm font-medium text-ink-soft">School Admin</span>
          <BrandLogo height={56} />
          <div className="justify-self-end">
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">{school?.name}</h1>
          <p className="text-ink-soft mt-1">
            {teachers.length} teachers · {pupilCount}
            {school?.maxStudents != null && ` of ${school.maxStudents}`} pupils
          </p>
        </header>

        <div className="flex gap-2 border-b border-line" role="tablist">
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

        {tab === "teachers" && (
          <>
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">Create a teacher</h2>
              <CreateTeacherForm years={yearOptions} />
            </section>
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">
                Teachers ({teachers.length})
              </h2>
              {teachers.length === 0 ? (
                <p className="text-sm text-ink-faint">No teachers yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {teachers.map((t) => (
                    <TeacherListItem
                      key={String(t.id)}
                      teacher={{
                        id: Number(t.id),
                        fName: t.fName ?? "",
                        lName: t.lName ?? "",
                        email: t.personalDetails?.emailAddress ?? "",
                        profileName: t.profileName,
                        isActive: t.isActive,
                        yearIds: t.classesTaught.map((c) => c.classId),
                      }}
                      yearNames={t.classesTaught
                        .map((c) => c.masterClass)
                        .sort((a, b) => a.order - b.order)
                        .map((y) => y.name)
                        .join(", ")}
                      years={yearOptions}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {tab === "pupils" && (
          <>
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">Add a pupil</h2>
              <AddPupilForm years={yearOptions} />
            </section>
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">Pupils ({pupils.length})</h2>
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

        {tab === "years" && (
          <>
            {teacherOptions.length > 0 && (
              <section className="card p-6 sm:p-8">
                <h2 className="font-display text-lg font-semibold text-ink mb-4">Add a teacher to a year</h2>
                <AssignTeacherForm years={yearOptions} teachers={teacherOptions} />
              </section>
            )}
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">Years</h2>
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
      </main>
    </div>
  );
}
