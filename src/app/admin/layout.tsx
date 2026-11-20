import { AdminNav } from "./AdminNav";
import { AdminCard } from "./AdminCard";
import { AdminShell } from "./AdminShell";

/**
 * The admin top bar and the frame of the inner pages (the admin's card on the
 * left) are rendered here, not in each page, so they stay on screen while the
 * page below loads - clicking a link does not flicker.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      <AdminShell card={<AdminCard />}>{children}</AdminShell>
    </>
  );
}
