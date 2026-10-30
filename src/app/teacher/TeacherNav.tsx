import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BrandLogo } from "@/components/BrandLogo";
import { ProfileMenu, TEACHER_MENU } from "@/components/ProfileMenu";

/**
 * The bar every teacher screen shares, laid out like the parent's: Profile
 * to the left of Log out, as a menu holding Manage pupils and Your PIN.
 */
export async function TeacherNav({ userId }: { userId: number }) {
  const me = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { fName: true },
  });

  return (
    <nav className="bg-surface border-b border-line">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3.5 flex justify-between items-center gap-4">
        <Link href="/teacher" className="inline-flex items-center">
          <BrandLogo height={56} />
        </Link>
        <ProfileMenu initial={me?.fName ?? "T"} items={TEACHER_MENU} />
      </div>
    </nav>
  );
}
