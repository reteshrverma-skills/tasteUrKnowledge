import { DirectorNav } from "./DirectorNav";

/**
 * The director top bar is rendered here, not in each page, so it stays on
 * screen while the page below it loads - clicking a link does not flicker.
 */
export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DirectorNav />
      {children}
    </>
  );
}
