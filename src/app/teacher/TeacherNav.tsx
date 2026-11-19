import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { ProfileMenu, TEACHER_MENU } from "@/components/ProfileMenu";

/**
 * The bar every teacher screen shares, laid out like the parent's: Profile
 * to the left of Log out, as a menu holding Manage pupils and Your PIN.
 * Rendered once by the teacher layout, so it stays in place (no flicker)
 * while the page below it changes.
 */
export async function TeacherNav() {
  const session = await getSession();
  const me = session
    ? await prisma.userProfile.findUnique({
        where: { id: session.userId },
        select: { fName: true },
      })
    : null;

  return (
    <nav className="bg-surface border-b border-line">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3.5 flex justify-between items-center gap-4">
        <Link href="/teacher" className="inline-flex items-center">
          <BrandLogo height={56} />
        </Link>
        <ProfileMenu initial={me?.fName ?? "T"} items={TEACHER_MENU} />
      </div>
    </nav>
  );
}
