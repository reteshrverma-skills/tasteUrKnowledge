import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAccounts } from "@/lib/admin-password";
import { WelcomeCard } from "@/app/dashboard/StudentHome";
import { AccountPasswordForm } from "../AccountPasswordForm";

/** The kinds of account whose password an admin can reset here. */
const KINDS = {
  parent: { label: "Parent", userType: "PARENT", endpoint: "/api/admin/parent-password" },
  admin: { label: "Admin", userType: "ADMIN", endpoint: "/api/admin/admin-password" },
} as const;
type Kind = keyof typeof KINDS;

/**
 * Admin-only: reset a parent's or an admin's password, on one page. The tabs
 * above the form pick the kind of account (?type=parent | admin).
 *
 * The proxy guards every /admin route, but a page that lists accounts checks
 * the role itself rather than trusting the gate alone.
 */
export default async function AdminPasswordsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  const { type } = await searchParams;
  const kind: Kind = type === "admin" ? "admin" : "parent";
  const { label, userType, endpoint } = KINDS[kind];
  const accounts = await listAccounts(userType);

  return (
    <>
      <Link
        href="/admin"
        className="inline-block text-sm font-medium text-ink-soft hover:text-brand transition"
      >
        ← Back to dashboard
      </Link>
      <WelcomeCard eyebrow="ACCOUNTS" title="Passwords">
        Pick the kind of account, then the account, and set a new password for it.
      </WelcomeCard>

      <div className="card p-5 sm:p-6">
        <div className="flex gap-2 mb-5" role="tablist" aria-label="Account type">
          {(Object.keys(KINDS) as Kind[]).map((k) => (
            <Link
              key={k}
              href={`/admin/passwords?type=${k}`}
              role="tab"
              aria-selected={k === kind}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition ${
                k === kind
                  ? "bg-brand text-white border-brand"
                  : "bg-surface text-ink-soft border-line-strong hover:text-ink"
              }`}
            >
              {KINDS[k].label}
            </Link>
          ))}
        </div>

        {/* key: switching tabs starts the form afresh. */}
        <AccountPasswordForm
          key={kind}
          accounts={accounts}
          endpoint={endpoint}
          noun={label.toLowerCase()}
        />
      </div>
    </>
  );
}
