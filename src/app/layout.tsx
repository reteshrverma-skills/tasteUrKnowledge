import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

/**
 * Two faces, two jobs.
 *
 * Outfit is geometric and friendly enough for a nine-year-old's dashboard
 * while still looking credible on a parent's progress report; it carries every
 * heading. Inter runs the body text, where the job is legibility at 14px and
 * figures that line up in a column.
 *
 * Both are self-hosted at build time by next/font, so no request ever leaves
 * for Google and no visitor IP reaches them.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TasteUrKnowledge",
  description:
    "11+ practice for Year 4 and 5 - English, Maths, Verbal and Non-Verbal, with progress a parent can actually read.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
