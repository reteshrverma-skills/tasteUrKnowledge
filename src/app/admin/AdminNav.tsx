import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { TopNavLink as NavLink } from "@/components/TopNavLink";
import { ADMIN_MENU, ProfileMenu } from "@/components/ProfileMenu";

/**
 * The bar every admin screen shares, styled like the parent top bar: brand on
 * the left; Home, Mock tests, Statistics and the profile menu (every other
 * admin tool, and Log out) on the right.
 *
 * Rendered once by the admin layout, so it stays in place (no flicker) while
 * the page below it changes. NavLink highlights the current item.
 */
export function AdminNav() {
  return (
    <nav className="sticky top-0 z-10 bg-surface border-b border-line">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        <Link href="/admin" aria-label="Admin home">
          <BrandLogo height={44} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/admin" label="Home" match="/admin" exact>
            <path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" />
          </NavLink>
          <NavLink href="/admin/mock-tests" label="Mock tests" match="/admin/mock-tests">
            <rect x="5" y="3.5" width="14" height="17" rx="2" />
            <path d="M9 8h6M9 12h6M9 16h3" />
          </NavLink>
          <NavLink href="/admin/statistics" label="Statistics" match="/admin/statistics">
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
          </NavLink>
          <span className="ml-2">
            <ProfileMenu initial="A" items={ADMIN_MENU} />
          </span>
        </div>
      </div>
    </nav>
  );
}
