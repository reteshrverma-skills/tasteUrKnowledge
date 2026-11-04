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
export const SCHOOL_NAME_CLASS = "font-sans font-semibold text-login-navy";

/** The person's name, the same size as the school's wherever that is showing. */
export const PERSON_NAME_CLASS = `${SCHOOL_NAME_CLASS} text-2xl sm:text-xl lg:text-3xl`;
