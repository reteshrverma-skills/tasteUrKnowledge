import Link from "next/link";

/**
 * The bar every parent screen shares: Profile on the left of Logout, as a
 * menu with My Profile and Kids Profile inside it.
 *
 * <details> rather than client state, the same as the Maths topic frames:
 * the menu opens and closes with no JavaScript, so these pages stay server
 * components.
 */
export function ParentNav({ parentName }: { parentName: string }) {
  return (
    <nav className="bg-surface border-b border-line">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3.5 flex justify-between items-center gap-4">
        <Link
          href="/parent"
          className="font-display text-lg font-bold text-brand"
        >
          TasteUrKnowledge
        </Link>

        <div className="flex items-center gap-4">
          <details className="relative group">
            <summary className="flex items-center gap-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-sm font-medium text-ink-soft hover:text-ink transition">
              <span className="w-8 h-8 rounded-full bg-brand-tint text-brand grid place-items-center font-display text-sm font-semibold">
                {parentName.charAt(0).toUpperCase()}
              </span>
              Profile
              <span className="text-[10px] text-ink-faint transition-transform group-open:rotate-180">
                ▼
              </span>
            </summary>

            <div className="card absolute right-0 mt-2 w-60 py-1.5 z-20">
              <Link
                href="/parent/profile"
                className="block px-4 py-2.5 hover:bg-brand-tint transition"
              >
                <span className="block text-sm font-semibold text-ink">
                  My Profile
                </span>
                <span className="block text-xs text-ink-faint">
                  Your own details
                </span>
              </Link>
              <Link
                href="/parent/kids"
                className="block px-4 py-2.5 hover:bg-brand-tint transition border-t border-line"
              >
                <span className="block text-sm font-semibold text-ink">
                  Kids Profile
                </span>
                <span className="block text-xs text-ink-faint">
                  Add and update your children
                </span>
              </Link>
            </div>
          </details>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm font-medium text-ink-soft hover:text-poor transition"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
