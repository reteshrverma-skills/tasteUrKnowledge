import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RefreshQuestionBank } from "./RefreshQuestionBank";
import { ADMIN_MENU, ProfileMenu } from "@/components/ProfileMenu";

export default async function AdminPage() {
  // The proxy guards /admin; the page checks the role as well.
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-screen bg-ground">
      {/* Navigation */}
      <nav className="bg-surface border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand inline-flex items-center gap-2"><BrandLogo height={56} />Admin</h1>
          <ProfileMenu initial="A" items={ADMIN_MENU} />
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-ink">Admin Panel</h2>
          <p className="text-ink-soft mt-2">Manage quiz content and platform settings</p>
        </div>

        {/* Admin Menu. One accent bar per tile, matching the subject cards on
            the student dashboard, rather than five competing gradients. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              href: "/admin/english",
              title: "English Comprehension",
              blurb:
                "Add year-wise comprehension stories with their questions in one go",
              bar: "bg-master",
              wide: true,
            },
            {
              href: "/admin/english/generate",
              title: "Generate English with Claude",
              blurb:
                "Draft a new comprehension from your prompt, a level and reference passages; review it before saving",
              bar: "bg-explorer",
              wide: true,
            },
            {
              href: "/admin/nvr",
              title: "Non-Verbal Reasoning",
              blurb:
                "Browse questions by difficulty level and topic, with their database IDs",
              bar: "bg-navigator",
              wide: true,
            },
          ].map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className={`card group relative overflow-hidden p-6 transition hover:-translate-y-0.5 hover:shadow-lg ${
                tile.wide ? "md:col-span-2 lg:col-span-4" : ""
              }`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-1 ${tile.bar}`}
                aria-hidden="true"
              />
              <h3 className="font-display text-xl font-semibold text-ink group-hover:text-brand transition">
                {tile.title}
              </h3>
              <p className="text-ink-soft text-sm mt-1.5">{tile.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                Open
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>

        <RefreshQuestionBank />
      </div>
    </div>
  );
}
