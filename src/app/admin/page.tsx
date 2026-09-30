import Link from "next/link";

export default async function AdminPage() {
  // Middleware handles authentication and role check
  return (
    <div className="min-h-screen bg-ground">
      {/* Navigation */}
      <nav className="bg-surface border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand">TasteUrKnowledge - Admin</h1>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="text-ink-soft hover:text-brand font-medium"
            >
              Student Dashboard
            </Link>
            <Link
              href="/admin/parent-password"
              className="text-ink-soft hover:text-brand font-medium"
            >
              Change Parent Password
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
              href: "/admin/years",
              title: "Years",
              blurb: "Manage academic years",
              bar: "bg-explorer",
            },
            {
              href: "/admin/subjects",
              title: "Subjects",
              blurb: "Manage subjects",
              bar: "bg-starter",
            },
            {
              href: "/admin/days",
              title: "Days",
              blurb: "Manage quiz days",
              bar: "bg-navigator",
            },
            {
              href: "/admin/questions",
              title: "Questions",
              blurb: "Manage questions",
              bar: "bg-challenger",
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
      </div>
    </div>
  );
}
