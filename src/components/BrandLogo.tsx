import Image from "next/image";

/**
 * The SIGQS mark - capped figure rising from an open book - shown beside the name in
 * every page header. Decorative: the name next to it carries the meaning.
 */
export function BrandLogo({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={size}
      height={size}
      priority
      className="shrink-0"
    />
  );
}
