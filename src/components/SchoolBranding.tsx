import { getSession } from "@/lib/auth";
import { schoolBrandingFor } from "@/lib/school-logo";
import { SchoolBrandingProvider } from "@/components/SchoolBrandingContext";

/**
 * For the layouts of the pages a school's staff and pupils use: every BrandLogo
 * inside then shows their school's logo instead. Anyone not in a school with a
 * logo sees the page as usual.
 */
export async function SchoolBranding({ children }: { children: React.ReactNode }) {
  const value = await schoolBrandingFor(await getSession());
  return <SchoolBrandingProvider value={value}>{children}</SchoolBrandingProvider>;
}
