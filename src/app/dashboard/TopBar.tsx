import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSeniorStudent } from "@/lib/student-account";
import { TopNavLink as NavLink } from "@/components/TopNavLink";

/**
 * The student top bar, the same on every student screen: brand on the left;
 * Home, Mock Test (Grammar School) or Subjects (GCSE / A-Level), Progress, My Profile (GCSE / A-Level students only), the
 * student's initial and Log out on the right.
 * Admins (who may open student pages) also get a link back to /admin.
 *
 * Rendered once by the dashboard layout, so it stays in place (no flicker)
 * while the page below it changes. NavLink highlights the current item.
 */
export async function StudentTopBar() {
  const session = await getSession();
  const profile = session
    ? await prisma.userProfile.findUnique({
        where: { id: session.userId },
        select: { fName: true, profileName: true },
      })
    : null;
  const initial = (profile?.fName?.trim() || profile?.profileName || "S").charAt(0).toUpperCase();
  const senior = isSeniorStudent(session);

  return (
    <nav className="sticky top-0 z-10 bg-surface border-b border-line">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        <Link href="/dashboard" aria-label="Home">
          <BrandLogo height={44} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Grammar School practice subjects live on Home, so Home stays
              highlighted inside a subject too. */}
          <NavLink
            href="/dashboard"
            label="Home"
            match="/dashboard"
            exact
            alsoMatch={senior ? undefined : "/dashboard/subject/"}
          >
            <path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" />
          </NavLink>
          {senior ? (
            <NavLink href="/dashboard/subjects" label="Subjects" match="/dashboard/subject">
              <path d="M4 5.5C6 4.5 9 4.5 12 6c3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5v-13ZM12 6v13" />
            </NavLink>
          ) : (
            <NavLink href="/dashboard/mock-tests" label="Mock Test" match="/dashboard/mock-tests">
              <path d="M9 4h6v2.5H9zM9 5H6v15h12V5h-3M9 11h6M9 15h4" />
            </NavLink>
          )}
          <NavLink href="/dashboard#side" label="Progress">
            <path d="M4 20v-5M10 20v-9M16 20v-6M22 20V8" />
          </NavLink>
          {senior && (
            <NavLink href="/dashboard/profile" label="My Profile" match="/dashboard/profile">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
            </NavLink>
          )}
          {session?.userType === "ADMIN" && (
            <Link href="/admin" className="btn-quiet ml-1 px-3 py-1.5 text-sm">
              Admin
            </Link>
          )}
          <span
            className="ml-2 w-9 h-9 rounded-full bg-brand text-white grid place-items-center text-sm font-semibold"
            aria-hidden="true"
          >
            {initial}
          </span>
          <LogoutButton className="ml-1 text-sm font-medium text-ink-soft hover:text-poor transition" />
        </div>
      </div>
    </nav>
  );
}
