import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

/** The SIGQS Pathway pages: open to everyone, with the login page's top menu. */
export default function PathwayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />
      <main className="w-full max-w-[1200px] mx-auto px-5 sm:px-8 py-6 lg:py-8">
        {/* Always to the login page, even when this page was opened from a link elsewhere. */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-3.5 py-1.5 text-sm font-semibold text-login-teal hover:bg-login-border transition"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" aria-hidden="true">
            <path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
