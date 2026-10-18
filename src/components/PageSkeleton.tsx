import { BrandLogo } from "@/components/BrandLogo";

/**
 * What a page shows the instant it is clicked, while its data loads: the top
 * bar with the logo, then grey placeholders in the shape of cards. Without it
 * the old page sits frozen until the new one is ready, which feels slower than
 * it is.
 */
export function PageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="min-h-screen bg-ground" aria-busy="true" aria-live="polite">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <span className="h-4 w-24 rounded bg-line animate-pulse" />
          <BrandLogo height={56} />
          <span className="justify-self-end h-4 w-16 rounded bg-line animate-pulse" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <span className="sr-only">Loading…</span>
        <div className="h-7 w-56 rounded bg-line animate-pulse" />
        <div className="h-4 w-80 max-w-full rounded bg-line animate-pulse mt-3" />

        <div className="mt-8 space-y-4">
          {Array.from({ length: cards }, (_, i) => (
            <div key={i} className="card p-5">
              <div className="h-5 w-40 rounded bg-line animate-pulse" />
              <div className="h-4 w-full rounded bg-line/70 animate-pulse mt-3" />
              <div className="h-4 w-2/3 rounded bg-line/70 animate-pulse mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
