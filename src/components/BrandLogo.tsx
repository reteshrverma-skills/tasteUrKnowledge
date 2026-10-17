import Image from "next/image";

/**
 * The SIGQS logo - capped figure rising from an open book beside the name,
 * with the motto "Intelligent practice. Measurable progress." under it - shown
 * in every page header.
 */
export function BrandLogo({ height = 56 }: { height?: number }) {
  return (
    <Image
      src="/sigqs-logo.png"
      alt="SIGQS - Intelligent practice. Measurable progress."
      width={Math.round((height * 1810) / 546)}
      height={height}
      priority
      className="shrink-0"
    />
  );
}
