import { BrandLogo } from "@/components/BrandLogo";
import { ADMIN_MENU, DIRECTOR_MENU, ProfileMenu } from "@/components/ProfileMenu";
import { getSession } from "@/lib/auth";

/**
 * The bar every Product Director screen shares. Rendered once by the director
 * layout, so it stays in place (no flicker) while the page below it changes.
 * Admins may open these pages too and get the admin menu.
 */
export async function DirectorNav() {
  const session = await getSession();
  return (
    <nav className="bg-surface border-b border-line">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <span className="justify-self-start text-sm font-medium text-ink-soft">Product Director</span>
        <BrandLogo height={56} />
        <div className="justify-self-end">
          {session && (
            <ProfileMenu
              initial={session.profileName}
              items={session.userType === "ADMIN" ? ADMIN_MENU : DIRECTOR_MENU}
            />
          )}
        </div>
      </div>
    </nav>
  );
}
