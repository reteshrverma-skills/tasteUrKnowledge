import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Terms & Copyright - SIGQS",
};

/**
 * The notice parents agree to when they sign up. Public, so it can be read
 * before an account exists. Changing the substance here should go with a
 * fresh agreement from existing parents - see userProfile.termsAcceptedAt.
 */
export default function TermsPage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-ground">
      <header className="bg-surface border-b border-line">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-3.5">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 font-display text-lg font-bold text-brand"
          >
            <BrandLogo height={40} />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="font-display text-3xl font-bold text-ink">
          Terms &amp; Copyright
        </h1>

        <div className="card p-6 sm:p-8 mt-6 space-y-5 text-ink-soft leading-relaxed">
          <section>
            <h2 className="font-semibold text-ink text-lg mb-1.5">Copyright</h2>
            <p>
              All content on SIGQS - including questions, answer
              options, explanations, comprehension passages, figures and
              diagrams - is &copy; {year} SIGQS. All rights reserved.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-lg mb-1.5">
              Personal use only
            </h2>
            <p>
              Your subscription lets the children on your account use Practice
              Labs for their own learning at home. You may not:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>copy, download, screenshot or print content to share with others;</li>
              <li>publish content online, including on social media or forums;</li>
              <li>use content in a school, tutoring business or class;</li>
              <li>sell, resell or otherwise make money from content;</li>
              <li>share your login details outside your household.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-lg mb-1.5">
              If these terms are broken
            </h2>
            <p>
              We may suspend or close accounts that break these terms, and
              take further action where content has been copied or shared.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-ink text-lg mb-1.5">Contact</h2>
            <p>
              Questions about these terms:{" "}
              <a
                href="mailto:support@practicelabs.ai"
                className="font-medium text-brand hover:text-brand-hover"
              >
                support@practicelabs.ai
              </a>
            </p>
          </section>
        </div>

        <p className="text-center text-sm mt-8">
          <Link
            href="/register"
            className="font-semibold text-brand hover:text-brand-hover"
          >
            ← Back to sign up
          </Link>
        </p>
      </main>
    </div>
  );
}
