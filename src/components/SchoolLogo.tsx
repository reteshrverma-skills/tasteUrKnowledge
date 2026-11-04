/**
 * A school's logo. A plain img rather than next/image: the file is served only
 * to the school's own signed-in accounts, which the image optimiser cannot do.
 */
export function SchoolLogoImage({
  url,
  schoolName,
  className = "",
}: {
  url: string;
  schoolName: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`${schoolName} logo`}
      className={`w-auto max-w-[10rem] object-contain shrink-0 ${className}`}
    />
  );
}

/** Beside the school's name: tall enough to cover its lines of text. */
export const SCHOOL_LOGO_HEADER_CLASS = "h-16 sm:h-24";
