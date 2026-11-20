/** Placeholder cards while an admin page loads; the layout already draws the bar and left column. */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="card p-5">
          <div className="h-5 w-40 rounded bg-line animate-pulse" />
          <div className="h-4 w-full rounded bg-line/70 animate-pulse mt-3" />
          <div className="h-4 w-2/3 rounded bg-line/70 animate-pulse mt-2" />
        </div>
      ))}
    </div>
  );
}
