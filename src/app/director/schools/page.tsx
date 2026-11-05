import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { BrandLogo } from "@/components/BrandLogo";
import { CreateSchoolForm } from "./CreateSchoolForm";
import { EditSchoolForm, SchoolListItem } from "./SchoolListItem";
import { ADMIN_MENU, DIRECTOR_MENU, ProfileMenu } from "@/components/ProfileMenu";

/**
 * Product Director: create schools, each with its first School Admin, and see
 * the schools already set up. The School Admin then runs the school at
 * /school - classes, teachers and pupils.
 *
 * Full width, laid out like the School Admin's page: the list on the left
 * (35%) and the add/edit frame on the right (65%). Edit in the list opens that
 * school in the right frame (?edit=id); Save or Cancel goes back to the create
 * form. On a narrow screen the two stack, form first.
 */
export default async function DirectorSchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await getSession();
  if (
    !session ||
    (session.userType !== "PRODUCT_DIRECTOR" && session.userType !== "ADMIN")
  ) {
    redirect("/login");
  }

  const { edit } = await searchParams;
  const editing = Number(edit) || null;

  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address1: true,
      address2: true,
      city: true,
      postcode: true,
      contactEmail: true,
      maxStudents: true,
      isActive: true,
      members: {
        where: { userType: "SCHOOL_ADMIN" },
        select: { fName: true, mName: true, lName: true, profileName: true },
      },
      _count: {
        select: { members: { where: { userType: "STUDENT", isActive: true } } },
      },
    },
  });

  const schoolDetails = (s: (typeof schools)[number]) => ({
    id: Number(s.id),
    name: s.name,
    address1: s.address1 ?? "",
    address2: s.address2 ?? "",
    city: s.city ?? "",
    postcode: s.postcode ?? "",
    contactEmail: s.contactEmail ?? "",
    maxStudents: s.maxStudents,
    isActive: s.isActive,
  });
  const editingSchool = schools.find((s) => Number(s.id) === editing);

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link href="/director" className="justify-self-start text-sm font-medium text-ink-soft hover:text-brand">
            ← Statistics
          </Link>
          <BrandLogo height={56} />
          <div className="justify-self-end">
            <ProfileMenu
              initial={session.profileName}
              items={session.userType === "ADMIN" ? ADMIN_MENU : DIRECTOR_MENU}
            />
          </div>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Schools</h1>
          <p className="text-ink-soft mt-1">
            Each school gets a School Admin login. The School Admin creates teachers and pupils.
          </p>
        </header>

        {/* Left 35%: the list. Right 65%: create or edit. minmax(0, …) so a
            long name cannot widen a column past its share. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] items-start">
          <section className="card p-6 sm:p-8 lg:order-2">
            {editingSchool ? (
              <>
                <h2 className="font-display text-lg font-semibold text-ink mb-4">
                  Edit {editingSchool.name}
                </h2>
                <EditSchoolForm
                  key={String(editingSchool.id)}
                  school={schoolDetails(editingSchool)}
                  doneHref="/director/schools"
                />
              </>
            ) : (
              <>
                <h2 className="font-display text-lg font-semibold text-ink mb-4">Create a school</h2>
                <CreateSchoolForm />
              </>
            )}
          </section>

          <section className="card p-6 sm:p-8 lg:order-1">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">
              Current schools ({schools.length})
            </h2>
            {schools.length === 0 ? (
              <p className="text-sm text-ink-faint">No schools yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {schools.map((s) => (
                  <SchoolListItem
                    key={String(s.id)}
                    school={schoolDetails(s)}
                    pupilCount={s._count.members}
                    admins={s.members.map((m) => `${displayName(m)} (${m.profileName})`).join(", ")}
                    editHref={`/director/schools?edit=${s.id}`}
                    selected={Number(s.id) === editing}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
