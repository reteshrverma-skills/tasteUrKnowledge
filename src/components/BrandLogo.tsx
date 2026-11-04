"use client";

import Image from "next/image";
import { useSchoolBranding } from "@/components/SchoolBrandingContext";
import { SCHOOL_NAME_CLASS, SchoolLogoImage } from "@/components/SchoolLogo";

const CREDIT_HEIGHT = 14;

/**
 * The SIGQS logo - capped figure rising from an open book beside the name,
 * with the motto "Intelligent practice. Measurable progress." under it - shown
 * in every page header. Under a SchoolBranding layout the school's name sits
 * beside it, and a school with a logo shows its own instead, in the same height,
 * with the credit under it. The name gives way on a phone, where the bar is
 * full, and the page's own header shows it instead.
 */
export function BrandLogo({ height = 56 }: { height?: number }) {
  const school = useSchoolBranding();
  const sigqs = (
    <Image
      src="/sigqs-logo.png"
      alt="SIGQS - Intelligent practice. Measurable progress."
      width={Math.round((height * 1810) / 546)}
      height={height}
      priority
      className="shrink-0"
    />
  );
  if (!school) return sigqs;

  const name = (
    <span className={`${SCHOOL_NAME_CLASS} hidden sm:block text-xl lg:text-3xl leading-tight text-left`}>
      {school.name}
    </span>
  );

  if (!school.logoUrl) {
    return (
      <span className="inline-flex items-center gap-3 min-w-0">
        {sigqs}
        {name}
      </span>
    );
  }

  // The name is centred against the logo. The credit is centred under the
  // logo and wider than a narrow one, so from sm up, where the name is shown, it
  // hangs out on both sides rather than pushing the name away; ml-4 keeps its
  // left end on screen. It sets its own font because some pages' bars set a bold
  // one around the logo.
  return (
    <span className="inline-flex items-center gap-2 min-w-0 sm:ml-4 sm:pb-[14px]">
      <span className="relative inline-flex flex-col items-center shrink-0">
        <SchoolLogoImage url={school.logoUrl} schoolName={school.name} height={height - CREDIT_HEIGHT} />
        <span className="font-sans font-normal text-[10px] leading-[14px] text-ink-soft whitespace-nowrap sm:absolute sm:top-full sm:left-1/2 sm:-translate-x-1/2">
          Powered by <span className="font-bold">SIGQS Lab</span>
        </span>
      </span>
      {name}
    </span>
  );
}
