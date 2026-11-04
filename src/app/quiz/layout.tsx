import { SchoolBranding } from "@/components/SchoolBranding";

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <SchoolBranding>{children}</SchoolBranding>;
}
