/**
 * Shown below the (layout's) top bar while a dashboard page loads: grey cards
 * in the page's three-column shape. No header of its own, so the top bar
 * stays still and only the content area changes.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-ground" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 items-start">
        <div className="card overflow-hidden">
          <div className="h-16 bg-line animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-32 mx-auto rounded bg-line animate-pulse" />
            <div className="h-3 w-24 mx-auto rounded bg-line/70 animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
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
