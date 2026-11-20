/**
 * The frame of every admin page: the admin's left column, then the page.
 * Rendered by the admin layout, so the column stays mounted while the page
 * beside it changes - only its figures refresh (see AdminSideColumn).
 */
export function AdminShell({ card, children }: { card: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ground">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] items-start">
        {card}
        <section className="space-y-4 min-w-0">{children}</section>
      </main>
    </div>
  );
}
