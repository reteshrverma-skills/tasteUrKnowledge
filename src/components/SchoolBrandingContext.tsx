"use client";

import { createContext, useContext } from "react";
import type { SchoolBrandingValue } from "@/lib/school-logo";

const SchoolBrandingContext = createContext<SchoolBrandingValue | null>(null);

/** Hands the school's logo to BrandLogo, on client pages as well as server ones. */
export function SchoolBrandingProvider({
  value,
  children,
}: {
  value: SchoolBrandingValue | null;
  children: React.ReactNode;
}) {
  return <SchoolBrandingContext value={value}>{children}</SchoolBrandingContext>;
}

export function useSchoolBranding() {
  return useContext(SchoolBrandingContext);
}
