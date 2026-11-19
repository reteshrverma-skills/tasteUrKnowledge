import { SchoolBranding } from "@/components/SchoolBranding";
import { StudentTopBar } from "./TopBar";

/**
 * The top bar is rendered here, not in each page, so it stays on screen while
 * the page below it loads - clicking a menu item no longer flickers.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SchoolBranding>
      <StudentTopBar />
      {children}
    </SchoolBranding>
  );
}
