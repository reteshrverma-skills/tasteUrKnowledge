import { countryStats } from "@/lib/admin-stats";
import { displayName } from "@/lib/english";
import { loadAdminSide } from "@/app/admin/AdminCard";
import { StatsPanel } from "@/components/StatsPanel";
import { CountryStatsTable } from "@/components/CountryStatsTable";
import { MonthlyBarChart } from "@/components/MonthlyBarChart";
import { WelcomeCard } from "@/app/dashboard/StudentHome";

/**
 * The statistics themselves: greeting, practice at a glance beside the
 * by-country list, and new registrations month by month. Shown at /director
 * for product directors and at /admin/statistics for admins, where the admin
 * layout supplies the left column.
 */
export async function StatisticsFeed() {
  const [side, byCountry] = await Promise.all([loadAdminSide(), countryStats()]);
  if (!side) return null;
  const { session, stats, registrations, profile } = side;
  const name = profile ? displayName(profile) : session.profileName;

  return (
    <>
      <WelcomeCard eyebrow="PLATFORM STATISTICS" title={`Welcome, ${profile?.fName?.trim() || name}!`}>
        How the platform is being used, read fresh on every visit. UK time; the week starts on
        Monday.
      </WelcomeCard>

      {/* Side by side on a wide screen; stacked below that. */}
      <div className="grid gap-4 xl:grid-cols-2">
        <StatsPanel stats={stats} />
        <CountryStatsTable rows={byCountry} />
      </div>

      <h3 className="pt-1 text-sm font-semibold text-ink-soft">New registrations, month by month</h3>
      <MonthlyBarChart title="New students" unit="student accounts" months={registrations.students} />
      <MonthlyBarChart title="New schools / academies" unit="schools" months={registrations.schools} />
    </>
  );
}
