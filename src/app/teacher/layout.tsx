import { SchoolBranding } from "@/components/SchoolBranding";
import { TeacherNav } from "./TeacherNav";

/**
 * The teacher top bar is rendered here, not in each page, so it stays on
 * screen while the page below it loads - clicking a link does not flicker.
 */
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <SchoolBranding>
      <TeacherNav />
      {children}
    </SchoolBranding>
  );
}
