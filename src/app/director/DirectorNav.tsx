import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { TopNavLink as NavLink } from "@/components/TopNavLink";
import { DIRECTOR_MENU, ProfileMenu } from "@/components/ProfileMenu";
import { AdminNav } from "@/app/admin/AdminNav";
import { getSession } from "@/lib/auth";

/**
 * The bar every Product Director screen shares, styled like the other top
 * bars: brand on the left; Statistics, Schools and the profile menu on the
 * right. Admins open these pages from their own bar, so they keep it here.
 *
 * Rendered once by the director layout, so it stays in place (no flicker)
 * while the page below it changes.
 */
export async function DirectorNav() {
  const session = await getSession();
  if (session?.userType === "ADMIN") return <AdminNav />;

  return (
    <nav className="sticky top-0 z-10 bg-surface border-b border-line">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        <Link href="/director" aria-label="Statistics">
          <BrandLogo height={44} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/director" label="Statistics" match="/director" exact>
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
          </NavLink>
          <NavLink href="/director/schools" label="Schools" match="/director/schools">
            <path d="M3 10 12 5l9 5-9 5-9-5Z" />
            <path d="M7 12.5V17c1.5 1.3 3.2 2 5 2s3.5-.7 5-2v-4.5" />
          </NavLink>
          {session && (
            <span className="ml-2">
              <ProfileMenu initial={session.profileName} items={DIRECTOR_MENU} />
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
