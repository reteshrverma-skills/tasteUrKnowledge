import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export interface ProfileMenuItem {
  href: string;
  label: string;
  hint: string;
}

/**
 * The right-hand end of a top bar: a round initial with "Profile", opening a
 * menu of the account's pages, then Log out - the layout ParentNav uses.
 *
 * <details> rather than client state, so it needs no JavaScript and works in
 * server and client components alike.
 */
export function ProfileMenu({ initial, items }: { initial: string; items: ProfileMenuItem[] }) {
  return (
    <div className="flex items-center gap-4">
      <details className="relative group">
        <summary className="flex items-center gap-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-sm font-medium text-ink-soft hover:text-ink transition">
          <span className="w-8 h-8 rounded-full bg-brand-tint text-brand grid place-items-center font-display text-sm font-semibold">
            {(initial || "?").charAt(0).toUpperCase()}
          </span>
          Profile
          <span className="text-[10px] text-ink-faint transition-transform group-open:rotate-180">▼</span>
        </summary>

        <div className="card absolute right-0 mt-2 w-64 py-1.5 z-20">
          {items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 hover:bg-brand-tint transition ${
                index > 0 ? "border-t border-line" : ""
              }`}
            >
              <span className="block text-sm font-semibold text-ink">{item.label}</span>
              <span className="block text-xs text-ink-faint">{item.hint}</span>
            </Link>
          ))}
        </div>
      </details>

      <LogoutButton />
    </div>
  );
}

/** The admin's menu, on every admin page. */
export const ADMIN_MENU: ProfileMenuItem[] = [
  { href: "/admin", label: "Admin Panel", hint: "Question banks and tools" },
  { href: "/dashboard", label: "Student Dashboard", hint: "See the app as a student" },
  { href: "/admin/parent-password", label: "Parent passwords", hint: "Change a parent's password" },
  { href: "/admin/admin-password", label: "Admin passwords", hint: "Change an admin's password" },
  { href: "/admin/director-accounts", label: "Product Directors", hint: "Create and manage their logins" },
  { href: "/director", label: "Statistics", hint: "Platform figures and schools" },
];

/** The Product Director's menu. */
export const DIRECTOR_MENU: ProfileMenuItem[] = [
  { href: "/director", label: "Statistics", hint: "Platform figures" },
  { href: "/director/schools", label: "Schools", hint: "Create and edit schools" },
];

/** A teacher's menu. */
export const TEACHER_MENU: ProfileMenuItem[] = [
  { href: "/teacher/pupils", label: "Manage pupils", hint: "Add and update your pupils" },
  { href: "/teacher/pin", label: "Your PIN", hint: "Ends a pupil's turn on a device" },
];
