import { SchoolBranding } from "@/components/SchoolBranding";

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return <SchoolBranding>{children}</SchoolBranding>;
}
