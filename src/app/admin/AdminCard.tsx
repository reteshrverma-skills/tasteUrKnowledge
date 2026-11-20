import { cache } from "react";
import { getSession, type Session } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/english";
import { adminStats, monthlyRegistrations } from "@/lib/admin-stats";
import { AdminSideColumn, type AdminSideFigures } from "./AdminSideColumn";

const num = (value: number) => value.toLocaleString("en-GB");

/**
 * The figures behind the left column. cache(): the layout and a page under it
 * (admin home, statistics) may both need them, and should read them once per
 * request, not twice.
 */
export const loadAdminSide = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const [stats, registrations, academies, profile] = await Promise.all([
    adminStats(),
    monthlyRegistrations(),
    // Schools and academies set up on the platform.
    prisma.school.count(),
    prisma.userProfile.findUnique({
      where: { id: session.userId },
      select: { fName: true, lName: true, profileName: true },
    }),
  ]);
  return { session, stats, registrations, academies, profile };
});

/** The column's content as plain data, for the first render and for the refresh API. */
export async function adminSideFigures(): Promise<AdminSideFigures | null> {
  const data = await loadAdminSide();
  if (!data) return null;
  const { session, stats, registrations, academies, profile } = data;
  const thisMonth = (months: { count: number }[]) => months[months.length - 1]?.count ?? 0;
  return {
    name: profile ? displayName(profile) : session.profileName,
    subtitle: session.userType === "ADMIN" ? "Admin account" : "Product Director",
    userId: profile?.profileName ?? session.profileName,
    stats: [
      { label: "All accounts", value: num(stats.accounts.total) },
      { label: "Students", value: num(stats.accounts.students) },
      { label: "Academies", value: num(academies) },
      { label: "Logins today", value: num(stats.studentLogins.today) },
      { label: "Practice today", value: `${num(stats.practiceMinutes.today)} min` },
    ],
    month: [
      { label: "New students", value: num(thisMonth(registrations.students)) },
      { label: "New schools", value: num(thisMonth(registrations.schools)) },
      { label: "Students logged in", value: num(stats.studentLogins.month) },
      { label: "Practice", value: `${num(stats.practiceMinutes.month)} min` },
    ],
  };
}

/** Who may read the column's figures: admins and product directors. */
export function canSeeAdminSide(session: Session | null): boolean {
  return session?.userType === "ADMIN" || session?.userType === "PRODUCT_DIRECTOR";
}

/**
 * The left column of every admin screen and the statistics page: the
 * viewer's card with the headline figures, and this month at a glance.
 * Rendered on the server for the first paint; after that the column stays
 * mounted and only its figures are refreshed (see AdminSideColumn).
 */
export async function AdminCard() {
  const figures = await adminSideFigures();
  return figures ? <AdminSideColumn initial={figures} /> : null;
}
