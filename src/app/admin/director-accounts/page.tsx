import Link from "next/link";
import { redirect } from "next/navigation";
import { WelcomeCard } from "@/app/dashboard/StudentHome";
import { getSession } from "@/lib/auth";
import { listAccounts } from "@/lib/admin-password";
import { AccountPasswordForm } from "../AccountPasswordForm";
import { CreateDirectorForm } from "./CreateDirectorForm";

/**
 * Admin-only: create Product Director logins and reset their passwords. A
 * Product Director sees the platform statistics at /director and nothing else.
 */
export default async function DirectorAccountsPage() {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const directors = await listAccounts("PRODUCT_DIRECTOR");

  return (
    <>
        <Link href="/admin" className="inline-block text-sm font-medium text-ink-soft hover:text-brand transition">
          ← Back to dashboard
        </Link>
        <WelcomeCard eyebrow="ACCOUNTS" title="Product Director accounts">
          A Product Director logs in to read-only platform statistics. They cannot see students&apos; work,
          parents&apos; details or any admin tools.
        </WelcomeCard>

        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Create an account</h2>
          <CreateDirectorForm />
        </section>

        <section className="card p-5 sm:p-6">
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
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">Change a password</h2>
            <AccountPasswordForm
              accounts={directors}
              endpoint="/api/admin/director-password"
              noun="product director"
            />
          </section>
        )}
    </>
  );
}
