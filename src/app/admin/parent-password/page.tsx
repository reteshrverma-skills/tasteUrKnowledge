import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAccounts } from "@/lib/admin-password";
import { AccountPasswordForm } from "../AccountPasswordForm";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Admin-only screen for resetting a parent's password.
 *
 * The proxy guards every /admin route, but a page that lists accounts checks
 * the role itself rather than trusting the gate alone.
 */
export default async function AdminParentPasswordPage() {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const parents = await listAccounts("PARENT");

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/admin"
            className="text-2xl font-bold text-brand inline-flex items-center gap-2"
          >
            <BrandLogo size={36} />
            SIGQS - Admin
          </Link>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="text-ink-soft hover:text-brand font-medium"
            >
              ← Admin Panel
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-ink-soft hover:text-red-600 font-medium"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-ink">
            Change Parent Password
          </h2>
          <p className="text-ink-soft mt-2">
            Pick a parent and set a new password for their login.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <AccountPasswordForm
            accounts={parents}
            endpoint="/api/admin/parent-password"
            noun="parent"
          />
        </div>
      </div>
    </div>
  );
}
