import Image from "next/image";

/**
 * The SIGQS logo - capped figure rising from an open book beside the name -
 * shown in every page header. `motto` adds "Intelligent practice. Measurable
 * progress." under the name; leave it off in slim top bars, where it would be
 * too small to read.
 */
export function BrandLogo({
  height = 40,
  motto = false,
}: {
  height?: number;
  motto?: boolean;
}) {
  return (
    <Image
      src={motto ? "/sigqs-logo.png" : "/sigqs-logo-compact.png"}
      alt={motto ? "SIGQS - Intelligent practice. Measurable progress." : "SIGQS"}
      width={Math.round((height * 1810) / 546)}
      height={height}
      priority
      className="shrink-0"
    />
  );
}
