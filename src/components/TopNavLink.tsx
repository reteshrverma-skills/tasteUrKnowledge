"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * One item of a top bar (student, parent). The bars live in layouts and stay
 * mounted between pages, so the active item is worked out here from the
 * address: `match` is a path prefix, or the exact path when `exact` is set.
 * Leave `match` out for an item that is never highlighted.
 */
export function TopNavLink({
  href,
  label,
  match,
  exact = false,
  children,
}: {
  href: string;
  label: string;
  match?: string;
  exact?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    match !== undefined &&
    (exact ? pathname === match : pathname.startsWith(match));
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
