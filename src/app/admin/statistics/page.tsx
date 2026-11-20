import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { StatisticsFeed } from "@/app/director/StatisticsFeed";

/**
 * Platform statistics for an admin, inside the admin layout so the top bar
 * and left column stay in place. Product directors see the same at /director.
 */
export default async function AdminStatisticsPage() {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") redirect("/login");
  return <StatisticsFeed />;
}
