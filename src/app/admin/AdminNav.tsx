import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ADMIN_MENU, ProfileMenu } from "@/components/ProfileMenu";

/**
 * The bar every admin screen shares: brand and "Admin" (back to the panel) on
 * the left, the profile menu on the right. Rendered once by the admin layout,
 * so it stays in place (no flicker) while the page below it changes.
 */
export function AdminNav() {
  return (
    <nav className="bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/admin" className="text-2xl font-bold text-brand inline-flex items-center gap-2">
          <BrandLogo height={56} />
          Admin
        </Link>
        <ProfileMenu initial="A" items={ADMIN_MENU} />
      </div>
    </nav>
  );
}
