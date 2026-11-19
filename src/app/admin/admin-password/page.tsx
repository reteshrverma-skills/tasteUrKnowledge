import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAccounts } from "@/lib/admin-password";
import { AccountPasswordForm } from "../AccountPasswordForm";

/** Admin-only screen for resetting an admin's password. */
export default async function AdminAdminPasswordPage() {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const admins = await listAccounts("ADMIN");

  return (
    <div className="min-h-screen bg-ground">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-ink">Change Admin Password</h2>
          <p className="text-ink-soft mt-2">
            Pick an admin account and set a new password for it.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <AccountPasswordForm
            accounts={admins}
            endpoint="/api/admin/admin-password"
            noun="admin"
          />
        </div>
      </div>
    </div>
  );
}
