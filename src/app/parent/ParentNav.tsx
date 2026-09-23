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
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
        <Link href="/parent" className="text-2xl font-bold text-indigo-600">
          TasteUrKnowledge
        </Link>

        <div className="flex items-center gap-4">
          <details className="relative group">
            <summary className="flex items-center gap-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-gray-700 hover:text-indigo-700 font-medium">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                {parentName.charAt(0).toUpperCase()}
              </span>
              Profile
              <span className="text-xs text-gray-400 transition-transform group-open:rotate-180">
                ▼
              </span>
            </summary>

            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <Link
                href="/parent/profile"
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span className="font-semibold">My Profile</span>
                <span className="block text-xs text-gray-500">
                  Your own details
                </span>
              </Link>
              <Link
                href="/parent/kids"
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 border-t border-gray-100"
              >
                <span className="font-semibold">Kids Profile</span>
                <span className="block text-xs text-gray-500">
                  Add and update your children
                </span>
              </Link>
            </div>
          </details>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-gray-600 hover:text-red-600 font-medium"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
