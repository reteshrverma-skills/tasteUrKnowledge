import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Screen resolution - SIGQS help",
};

const SCREENS: [string, string, string, string][] = [
  ["1920 × 1080", "100%", "1920px", "Side by side, plenty of room"],
  ["1920 × 1080", "125% (common on laptops)", "1536px", "Side by side, ideal"],
  ["1920 × 1080", "150%", "1280px", "Side by side"],
  ["1366 × 768", "100%", "1366px", "Side by side"],
  ["2560 × 1440", "150%", "1707px", "Side by side"],
  ["2560 × 1600", "200% (e.g. MacBook)", "1280px", "Side by side"],
];

const TABLETS: [string, string, string][] = [
  ["iPad 9th gen (10.2\")", "1080px", "Side by side"],
  ["iPad 10th gen / iPad Air", "1180px", "Side by side"],
  ["iPad mini", "1133px", "Side by side"],
  ["iPad Pro 11\"", "1194px", "Side by side"],
  ["iPad Pro 12.9\"", "1366px", "Side by side"],
  ["Samsung Galaxy Tab S-series (11\")", "about 1280–1300px", "Side by side"],
  ["Amazon Fire HD 10", "about 1280px", "Side by side"],
  ["8\" Android or Fire HD 8", "about 960px", "Stacked"],
  ["Any tablet, upright", "about 750–1000px", "Stacked"],
];

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="eyebrow">
            {head.map((h) => (
              <th key={h} className="text-left pb-2 pr-4 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("|")} className="border-t border-line">
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={`py-2 pr-4 ${
                    i === row.length - 1
                      ? cell === "Stacked"
                        ? "text-ink-soft"
                        : "text-good font-medium"
                      : "text-ink"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Help: which screens, zoom levels and tablets show the School Admin page's
 * add/edit frame and list side by side (the Tailwind lg breakpoint, 1024 CSS
 * pixels), and which stack them.
 */
export default function ResolutionHelpPage() {
  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-3.5 flex items-center">
          <Link href="/login" className="inline-flex items-center">
            <BrandLogo height={56} />
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-10 space-y-6">
        <BackLink />
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Screen resolution</h1>
          <p className="text-ink-soft mt-1">The best screen and zoom settings for SIGQS.</p>
        </header>

        <section className="card p-6 sm:p-8 space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink">Recommended</h2>
          <p className="text-sm text-ink">
            A browser window at least <strong>1366 pixels wide</strong>, with the browser zoom at{" "}
            <strong>100%</strong> (press <kbd className="px-1.5 py-0.5 rounded border border-line text-xs">Ctrl</kbd>{" "}
            + <kbd className="px-1.5 py-0.5 rounded border border-line text-xs">0</kbd> to reset it). A 1920 × 1080 screen
            at 100–125% Windows scaling is ideal; most school and office laptops are already set up this way.
          </p>
          <p className="text-sm text-ink-soft">
            On the School Admin page, any window <strong>1024 pixels or wider</strong> shows the add/edit form and the list
            side by side. On a narrower window they stack, form on top - everything still works, you scroll down to the
            list.
          </p>
        </section>

        <section className="card p-6 sm:p-8 space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink">Resolution or window size?</h2>
          <p className="text-sm text-ink">
            What matters is the <strong>width of the browser window</strong>, not the screen&apos;s resolution. Windows
            scaling and browser zoom both shrink the width the page sees: a 2560-pixel screen at 200% scaling behaves like a
            1280-pixel one, and zooming the browser to 150% shrinks it again. A window snapped to half the screen is half as
            wide.
          </p>
        </section>

        <section className="card p-6 sm:p-8 space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink">Laptops and desktops</h2>
          <p className="text-sm text-ink-soft">Window maximised, browser zoom at 100%.</p>
          <Table head={["Screen resolution", "Windows scaling", "Width the browser sees", "Layout"]} rows={SCREENS} />
        </section>

        <section className="card p-6 sm:p-8 space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink">Tablets</h2>
          <p className="text-sm text-ink-soft">
            Most tablets show the side-by-side layout in landscape; small 7–8&quot; tablets and any tablet held upright
            stack. On the 1080–1200 pixel iPads the list is fairly narrow, so long email addresses wrap onto two lines.
            Typical figures - exact widths vary by model and browser.
          </p>
          <Table head={["Tablet (landscape)", "Width the browser sees", "Layout"]} rows={TABLETS} />
          <p className="text-sm text-ink">
            The teacher dashboard and pupils&apos; practice pages do not use the split, so they work on any tablet, either
            way round.
          </p>
        </section>
      </main>
    </div>
  );
}
