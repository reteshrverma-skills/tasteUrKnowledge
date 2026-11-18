import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * The student top bar, the same on every student screen: brand on the left;
 * Home, Subjects, Progress, the student's initial and Log out on the right.
 * Admins (who may open student pages) also get a link back to /admin.
 */
export async function StudentTopBar({
  active,
}: {
  active: "home" | "subjects" | "progress";
}) {
  const session = await getSession();
  const profile = session
    ? await prisma.userProfile.findUnique({
        where: { id: session.userId },
        select: { fName: true, profileName: true },
      })
    : null;
  const initial = (profile?.fName?.trim() || profile?.profileName || "S").charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-10 bg-surface border-b border-line">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        <Link href="/dashboard" aria-label="Home">
          <BrandLogo height={44} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/dashboard" label="Home" active={active === "home"}>
            <path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" />
          </NavLink>
          <NavLink href="/dashboard#subjects" label="Subjects" active={active === "subjects"}>
            <path d="M4 5.5C6 4.5 9 4.5 12 6c3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5v-13ZM12 6v13" />
          </NavLink>
          <NavLink href="/dashboard#side" label="Progress" active={active === "progress"}>
            <path d="M4 20v-5M10 20v-9M16 20v-6M22 20V8" />
          </NavLink>
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

function NavLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center px-2 sm:px-3 py-1 text-[11px] font-medium border-b-2 transition ${
        active ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
      <span className="hidden sm:block">{label}</span>
    </Link>
  );
}
