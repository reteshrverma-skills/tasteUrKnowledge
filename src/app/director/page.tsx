import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminStats, countryStats } from "@/lib/admin-stats";
import { BrandLogo } from "@/components/BrandLogo";
import { StatsPanel } from "@/components/StatsPanel";
import { CountryStatsTable } from "@/components/CountryStatsTable";
import { ADMIN_MENU, DIRECTOR_MENU, ProfileMenu } from "@/components/ProfileMenu";

/**
 * The Product Director's home: user statistics - accounts by type, students
 * logged in, and practice time - plus the way into creating schools. No
 * student, parent or admin tools are reachable from this account; the proxy
 * sends it back here.
 */
export default async function DirectorPage() {
  // The proxy lets only product directors (and admins) in; checked again here
  // because the page reads figures across every account.
  const session = await getSession();
  if (
    !session ||
    (session.userType !== "PRODUCT_DIRECTOR" && session.userType !== "ADMIN")
  ) {
    redirect("/login");
  }

  const [stats, byCountry] = await Promise.all([adminStats(), countryStats()]);

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <span className="justify-self-start text-sm font-medium text-ink-soft">
            Product Director
          </span>
          <BrandLogo height={56} />
          <div className="justify-self-end">
            <ProfileMenu
              initial={session.profileName}
              items={session.userType === "ADMIN" ? ADMIN_MENU : DIRECTOR_MENU}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Platform statistics
          </h1>
          <Link href="/director/schools" className="btn-primary px-5 py-2 text-sm">
            Schools
          </Link>
        </div>
        <StatsPanel stats={stats} />
        <CountryStatsTable rows={byCountry} />
      </main>
    </div>
  );
}
