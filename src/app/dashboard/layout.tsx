import { SchoolBranding } from "@/components/SchoolBranding";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SchoolBranding>{children}</SchoolBranding>;
}
