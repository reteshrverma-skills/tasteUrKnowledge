import Link from "next/link";

/**
 * "Help" in the top bar, next to Log out: a small menu of help pages.
 *
 * <details> rather than client state, as ProfileMenu does, so it needs no
 * JavaScript and works in server and client components alike.
 */
export function HelpMenu() {
  return (
    <details className="relative group">
      <summary className="flex items-center gap-1.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-sm font-medium text-ink-soft hover:text-ink transition">
        Help
        <span className="text-[10px] text-ink-faint transition-transform group-open:rotate-180">▼</span>
      </summary>
      <div className="card absolute right-0 mt-2 w-64 py-1.5 z-20">
        <Link href="/help/resolution" className="block px-4 py-2.5 hover:bg-brand-tint transition">
          <span className="block text-sm font-semibold text-ink">Resolution</span>
          <span className="block text-xs text-ink-faint">Best screen, zoom and tablet settings</span>
        </Link>
      </div>
    </details>
  );
}
