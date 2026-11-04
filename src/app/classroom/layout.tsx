import { SchoolBranding } from "@/components/SchoolBranding";

export default function ClassroomLayout({ children }: { children: React.ReactNode }) {
  return <SchoolBranding>{children}</SchoolBranding>;
}
