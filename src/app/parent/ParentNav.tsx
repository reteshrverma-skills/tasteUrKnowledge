import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { LogoutButton } from "@/components/LogoutButton";

/**
 * The bar every parent screen shares, styled like the student top bar:
 * brand on the left; Home, Children, Profile, the parent's initial and Log out
 * on the right.
 */
export function ParentNav({
  parentName,
  active,
}: {
  parentName: string;
  active?: "home" | "children" | "profile";
}) {
  return (
    <nav className="sticky top-0 z-10 bg-surface border-b border-line">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        <Link href="/parent" aria-label="Home">
          <BrandLogo height={44} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/parent" label="Home" active={active === "home"}>
            <path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" />
          </NavLink>
          <NavLink href="/parent/children" label="Children" active={active === "children"}>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
            <circle cx="16.5" cy="8.5" r="3" />
            <path d="M17 14a5.5 5.5 0 0 1 4.5 6" />
          </NavLink>
          <NavLink href="/parent/profile" label="Profile" active={active === "profile"}>
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
