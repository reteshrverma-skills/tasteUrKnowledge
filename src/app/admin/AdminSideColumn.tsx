"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ProfileCard, SidePanel } from "@/app/dashboard/StudentHome";

export interface AdminSideFigures {
  name: string;
  subtitle: string;
  userId: string;
  stats: { label: string; value: string }[];
  month: { label: string; value: string }[];
}

/**
 * The admin left column. It lives in the layout, so moving between admin
 * pages does not redraw it; each move fetches the latest figures and swaps
 * only the numbers in place. A failed fetch keeps the figures already shown.
 */
export function AdminSideColumn({ initial }: { initial: AdminSideFigures }) {
  const [figures, setFigures] = useState(initial);
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    // The first render already has fresh figures from the server.
    if (first.current) {
      first.current = false;
      return;
    }
    const controller = new AbortController();
    fetch("/api/admin/side", { signal: controller.signal, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: AdminSideFigures | null) => {
        if (data) setFigures(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [pathname]);

  return (
    <aside className="space-y-4 lg:sticky lg:top-20">
      <ProfileCard
        className=""
        name={figures.name}
        subtitle={figures.subtitle}
        userId={figures.userId}
        stats={figures.stats}
      />
      <SidePanel title="This month">
        <dl className="mt-2 text-sm space-y-2">
          {figures.month.map((row) => (
            <div key={row.label} className="flex justify-between gap-3">
              <dt className="text-ink-soft">{row.label}</dt>
              <dd className="font-semibold text-brand tabular">{row.value}</dd>
            </div>
          ))}
        </dl>
      </SidePanel>
    </aside>
  );
}
