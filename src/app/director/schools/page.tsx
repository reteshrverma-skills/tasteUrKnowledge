import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { BrandLogo } from "@/components/BrandLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { CreateSchoolForm } from "./CreateSchoolForm";
import { SchoolListItem } from "./SchoolListItem";

/**
 * Product Director: create schools, each with its first School Admin, and see
 * the schools already set up. The School Admin then runs the school at
 * /school - classes, teachers and pupils.
 */
export default async function DirectorSchoolsPage() {
  const session = await getSession();
  if (
    !session ||
    (session.userType !== "PRODUCT_DIRECTOR" && session.userType !== "ADMIN")
  ) {
    redirect("/login");
  }

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

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link href="/director" className="justify-self-start text-sm font-medium text-ink-soft hover:text-brand">
            ← Statistics
          </Link>
          <BrandLogo height={56} />
          <div className="justify-self-end">
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Schools</h1>
          <p className="text-ink-soft mt-1">
            Each school gets a School Admin login. The School Admin creates teachers and pupils.
          </p>
        </header>

        <section className="card p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Create a school</h2>
          <CreateSchoolForm />
        </section>

        <section className="card p-6 sm:p-8">
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
                  school={{
                    id: Number(s.id),
                    name: s.name,
                    address1: s.address1 ?? "",
                    address2: s.address2 ?? "",
                    city: s.city ?? "",
                    postcode: s.postcode ?? "",
                    contactEmail: s.contactEmail ?? "",
                    maxStudents: s.maxStudents,
                    isActive: s.isActive,
                  }}
                  pupilCount={s._count.members}
                  admins={s.members.map((m) => `${displayName(m)} (${m.profileName})`).join(", ")}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
