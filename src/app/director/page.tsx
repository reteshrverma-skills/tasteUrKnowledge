import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminCard, canSeeAdminSide } from "@/app/admin/AdminCard";
import { StatisticsFeed } from "./StatisticsFeed";

/**
 * Platform statistics - the Product Director's home. Admins see the same
 * figures at /admin/statistics, inside their own layout. No student, parent
 * or admin tools are reachable from a Product Director account; the proxy
 * sends it back here.
 */
export default async function DirectorPage() {
  // The proxy lets only product directors (and admins) in; checked again here
  // because the page reads figures across every account.
  const session = await getSession();
  if (!canSeeAdminSide(session)) redirect("/login");
  // Admins keep their own layout, so the left column is not redrawn.
  if (session!.userType === "ADMIN") redirect("/admin/statistics");

  return (
    <div className="min-h-screen bg-ground">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] items-start">
        <AdminCard />
        <section className="space-y-4 min-w-0">
          <StatisticsFeed />
        </section>
      </main>
    </div>
  );
}
