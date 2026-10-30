import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAccounts } from "@/lib/admin-password";
import { BrandLogo } from "@/components/BrandLogo";
import { AccountPasswordForm } from "../AccountPasswordForm";
import { CreateDirectorForm } from "./CreateDirectorForm";
import { ADMIN_MENU, ProfileMenu } from "@/components/ProfileMenu";

/**
 * Admin-only: create Product Director logins and reset their passwords. A
 * Product Director sees the platform statistics at /director and nothing else.
 */
export default async function DirectorAccountsPage() {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const directors = await listAccounts("PRODUCT_DIRECTOR");

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link href="/admin" className="justify-self-start text-sm font-medium text-ink-soft hover:text-brand">
            ← Admin Panel
          </Link>
          <BrandLogo height={56} />
          <div className="justify-self-end">
            <ProfileMenu initial="A" items={ADMIN_MENU} />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Product Director accounts</h1>
          <p className="text-ink-soft mt-1">
            A Product Director logs in to read-only platform statistics. They cannot see students&apos; work,
            parents&apos; details or any admin tools.
          </p>
        </header>

        <section className="card p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Create an account</h2>
          <CreateDirectorForm />
        </section>

        <section className="card p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">
            Current accounts ({directors.length})
          </h2>
          {directors.length === 0 ? (
            <p className="text-sm text-ink-faint">No Product Director accounts yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {directors.map((d) => (
                <li key={d.id} className="py-2.5 flex justify-between gap-4 text-sm">
                  <span className="text-ink">{d.name}</span>
                  <span className="text-ink-soft">
                    {d.profileName}
                    {!d.isActive && " · inactive"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {directors.length > 0 && (
          <section className="card p-6 sm:p-8">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">Change a password</h2>
            <AccountPasswordForm
              accounts={directors}
              endpoint="/api/admin/director-password"
              noun="product director"
            />
          </section>
        )}
      </main>
    </div>
  );
}
