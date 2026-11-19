import { AdminNav } from "./AdminNav";

/**
 * The admin top bar is rendered here, not in each page, so it stays on screen
 * while the page below it loads - clicking a link does not flicker.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
