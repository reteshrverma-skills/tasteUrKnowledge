import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { TopNavLink as NavLink } from "@/components/TopNavLink";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { parentProfile } from "@/lib/parent";

/**
 * The bar every parent screen shares, styled like the student top bar:
 * brand on the left; Home, Children, Profile, the parent's initial and Log out
 * on the right.
 *
 * Rendered once by the parent layout, so it stays in place (no flicker) while
 * the page below it changes. NavLink highlights the current item.
 */
export async function ParentNav() {
  const session = await getSession();
  const profile = session ? await parentProfile(session.userId) : null;
  const parentName = profile ? displayName(profile) : "Parent";

  return (
    <nav className="sticky top-0 z-10 bg-surface border-b border-line">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        <Link href="/parent" aria-label="Home">
          <BrandLogo height={44} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/parent" label="Home" match="/parent" exact>
            <path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" />
          </NavLink>
          <NavLink href="/parent/children" label="Children" match="/parent/children">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
            <circle cx="16.5" cy="8.5" r="3" />
            <path d="M17 14a5.5 5.5 0 0 1 4.5 6" />
          </NavLink>
          <NavLink href="/parent/profile" label="Profile" match="/parent/profile">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </NavLink>
          <span
            className="ml-2 w-9 h-9 rounded-full bg-brand text-white grid place-items-center text-sm font-semibold"
            aria-hidden="true"
          >
            {parentName.charAt(0).toUpperCase()}
          </span>
          <LogoutButton className="ml-1 text-sm font-medium text-ink-soft hover:text-poor transition" />
        </div>
      </div>
    </nav>
  );
}
