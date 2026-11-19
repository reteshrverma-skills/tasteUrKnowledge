import { ParentNav } from "./ParentNav";

/**
 * The parent top bar is rendered here, not in each page, so it stays on
 * screen while the page below it loads - clicking a menu item does not flicker.
 */
export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ParentNav />
      {children}
    </>
  );
}
