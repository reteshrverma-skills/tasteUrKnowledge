"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Non-Verbal figures drawn at one scale, so a shape in the question row and
 * the same shape among the options come out the same size on screen. When
 * they differ by a few pixels a child reads it as a deliberate difference.
 *
 * A question strip is a row of 86-unit cells, each holding a 100-unit option
 * drawing shrunk by the strip's first scale(...) (0.78 or so). A square
 * question figure is drawn 1:1 with the options. Either way, one option unit
 * on screen must equal one stem unit times that scale - FigureScale measures
 * the stem and sets the option size (and, when the options cannot grow that
 * big, shrinks the stem instead).
 *
 * All markup passed in must already have been through sanitiseFigure.
 */

/** The width an option drawing spans, in its own units. */
const OPTION_UNITS = 100;

/** The stem's height cap in px, matching the max-h-56 it used to carry. */
const STEM_MAX_HEIGHT = 224;

export function FigureScale({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const fit = () => {
      const holder = root.querySelector<HTMLElement>("[data-nvr-stem]");
      const svg = holder?.querySelector<SVGSVGElement>(":scope > svg");
      const option = root.querySelector<HTMLElement>("[data-nvr-option]");
      const box = option?.clientWidth ?? 0;
      const viewBox = svg?.viewBox.baseVal;

      if (!holder || !svg || !viewBox?.width || !viewBox.height || !box) {
        root.style.removeProperty("--nvr-fig");
        root.style.removeProperty("--nvr-stem-w");
        return;
      }

      // How much a strip shrinks each option drawing into its cell; a square
      // figure carries no cell scale and is drawn 1:1.
      const cellScale = Number(
        svg
          .querySelector(":scope > g[transform*='scale']")
          ?.getAttribute("transform")
          ?.match(/scale\(([\d.]+)/)?.[1] ?? 1
      );

      // px per stem unit, at the most room the stem may take.
      let unit = Math.min(
        holder.clientWidth / viewBox.width,
        STEM_MAX_HEIGHT / viewBox.height
      );
      let figure = OPTION_UNITS * cellScale * unit;

      // Options cannot outgrow their tile, so the stem comes down to them.
      if (figure > box) {
        unit = box / (OPTION_UNITS * cellScale);
        figure = box;
      }

      root.style.setProperty("--nvr-fig", `${figure}px`);
      root.style.setProperty("--nvr-stem-w", `${viewBox.width * unit}px`);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(root);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** The question figure, centred in its frame. */
export function StemFigure({ markup }: { markup: string }) {
  return (
    <div className="flex justify-center mb-5">
      <span className="card-quiet w-full max-w-xl p-3 text-ink">
        <span
          data-nvr-stem
          className="block mx-auto [&>svg]:block [&>svg]:mx-auto [&>svg]:max-w-full [&>svg]:w-[var(--nvr-stem-w,100%)] [&>svg]:h-auto [&>svg]:max-h-56"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      </span>
    </div>
  );
}

/** One option drawing: a square tile with the figure at the stem's scale. */
/** An option that is a figure rather than plain text such as a letter code. */
const isSvgMarkup = (value: string) => /^\s*<svg[\s>]/i.test(value);

export function OptionFigure({ markup }: { markup: string }) {
  // Letter-code and word options ("FM", "27") are text, not figures. Rendered
  // as a text node rather than markup, so nothing in them is ever parsed as
  // HTML.
  if (!isSvgMarkup(markup)) {
    return (
      <span
        data-nvr-option
        className="flex w-full aspect-square items-center justify-center text-center font-display text-2xl font-bold tracking-wide break-words"
      >
        {markup}
      </span>
    );
  }

  return (
    <span
      data-nvr-option
      className="flex w-full aspect-square items-center justify-center"
    >
      <span
        className="block aspect-square w-[var(--nvr-fig,100%)] max-w-full [&>svg]:w-full [&>svg]:h-full"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </span>
  );
}
