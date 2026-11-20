import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ADMIN_MENU } from "@/components/ProfileMenu";
import { SidePanel, WelcomeCard } from "@/app/dashboard/StudentHome";
import { RefreshQuestionBank } from "./RefreshQuestionBank";
import { loadAdminSide } from "./AdminCard";

/**
 * Where an admin lands after logging in, laid out like the parent dashboard:
 * the admin's card with platform counts on the left, the content tools in the
 * middle, and shortcuts to the account tools on the right.
 */
const TOOLS = [
  {
    href: "/admin/english",
    title: "English Comprehension",
    blurb: "Add year-wise comprehension stories with their questions in one go",
    letter: "E",
    tone: "bg-master",
  },
  {
    href: "/admin/english/generate",
    title: "Generate English with Claude",
    blurb:
      "Draft a new comprehension from your prompt, a level and reference passages; review it before saving",
    letter: "G",
    tone: "bg-explorer",
  },
  {
    href: "/admin/mock-tests",
    title: "Mock tests",
    blurb:
      "Grammar School mock papers: set the dates, break and section times, review the questions and approve",
    letter: "M",
    tone: "bg-challenger",
  },
  {
    href: "/admin/nvr",
    title: "Non-Verbal Reasoning",
    blurb: "Browse questions by stage and topic, with their database IDs",
    letter: "N",
    tone: "bg-navigator",
  },
];

/** Account tools go in the side panel; the tiles above already cover content. */
const SHORTCUTS = ADMIN_MENU.filter(
  (item) => item.href !== "/admin" && !TOOLS.some((tool) => tool.href === item.href)
);

export default async function AdminPage() {
  // The proxy guards /admin; the page checks the role as well.
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  // Shared with the left column, read once per request.
  const side = await loadAdminSide();
  if (!side) redirect("/login");
  const { stats } = side;

  return (
    // The layout draws the left column; this is the middle and right.
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
        {/* Middle: content tools. */}
        <section className="space-y-4 min-w-0">
          <WelcomeCard eyebrow="ADMIN DASHBOARD" title={`Welcome, ${session.profileName}!`}>
            Manage quiz content and platform settings.
          </WelcomeCard>

          <h3 className="pt-1 text-sm font-semibold text-ink-soft">Content</h3>

          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="card group flex items-center gap-4 px-5 sm:px-6 py-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span
                className={`w-11 h-11 rounded-full ${tool.tone} text-white grid place-items-center font-display font-semibold shrink-0`}
                aria-hidden="true"
              >
                {tool.letter}
              </span>
              <span className="min-w-0">
                <span className="block font-display font-semibold text-ink group-hover:text-brand transition">
                  {tool.title}
                </span>
                <span className="block text-sm text-ink-soft mt-0.5">{tool.blurb}</span>
              </span>
              <span
                aria-hidden="true"
                className="ml-auto text-brand font-semibold transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          ))}

          <RefreshQuestionBank />
        </section>

        {/* Right: account tools. */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <SidePanel title="Quick links">
            <ul className="mt-2 divide-y divide-line">
              {SHORTCUTS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block py-2.5 text-sm hover:text-brand transition">
                    <span className="block font-semibold text-ink">{item.label}</span>
                    <span className="block text-xs text-ink-faint">{item.hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SidePanel>
          <SidePanel title="Accounts">
            <dl className="mt-2 text-sm space-y-2">
              {[
                ["Students", stats.accounts.students],
                ["Parents", stats.accounts.parents],
                ["Admins", stats.accounts.admins],
                ["Product Directors", stats.accounts.directors],
                ["Inactive", stats.inactive],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-ink-soft">{label}</dt>
                  <dd className="font-semibold text-brand tabular">{value}</dd>
                </div>
              ))}
            </dl>
          </SidePanel>
        </aside>
    </div>
  );
}
