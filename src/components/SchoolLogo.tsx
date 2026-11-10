/**
 * A school's logo. A plain img rather than next/image: the file is served only
 * to the school's own signed-in accounts, which the image optimiser cannot do.
 */
export function SchoolLogoImage({
  url,
  schoolName,
  className = "",
  height,
}: {
  url: string;
  schoolName: string;
  className?: string;
  height?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`${schoolName} logo`}
      style={height ? { height } : undefined}
      className={`w-auto max-w-[10rem] object-contain shrink-0 ${className}`}
    />
  );
}

/** The school's name and the person's name under it, the same on every page. */
export const SCHOOL_NAME_CLASS = "font-display font-bold text-ink";

/**
 * The logged-in person's name, the same on every page: the parent home's
 * "Welcome, ..." style (display face, bold, dark ink).
 */
export const PERSON_NAME_CLASS = "font-display font-bold text-ink text-2xl sm:text-3xl";
