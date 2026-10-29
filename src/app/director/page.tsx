import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminStats, countryStats } from "@/lib/admin-stats";
import { BrandLogo } from "@/components/BrandLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { StatsPanel } from "@/components/StatsPanel";
import { CountryStatsTable } from "@/components/CountryStatsTable";

/**
 * The Product Director's home: user statistics only, read-only - accounts by
 * type, students logged in, and practice time. No student, parent or admin
 * tools are reachable from this account; the proxy sends it back here.
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
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-6">
          Platform statistics
        </h1>
        <StatsPanel stats={stats} />
        <CountryStatsTable rows={byCountry} />
      </main>
    </div>
  );
}
