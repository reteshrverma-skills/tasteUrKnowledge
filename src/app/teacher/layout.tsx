import { SchoolBranding } from "@/components/SchoolBranding";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <SchoolBranding>{children}</SchoolBranding>;
}
