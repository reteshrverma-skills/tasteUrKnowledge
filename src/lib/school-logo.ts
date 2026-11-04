import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/auth";
import { displayName } from "@/lib/english";

/** Large enough for a crisp crest; every pupil's device downloads it once. */
export const LOGO_MAX_BYTES = 1024 * 1024;

/**
 * The image type these bytes really are, or null. Read from the file itself,
 * because a browser's stated type and a file's name are whatever the sender
 * says. SVG is left out on purpose: it can carry scripts.
 */
export function logoTypeOf(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  const startsWith = (...values: number[]) => values.every((value, i) => bytes[i] === value);

  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/**
 * Where the school's logo is served from, or null when it has none. The URL
 * changes with each upload, so browsers can cache it for good and a new logo
 * still shows at once. The school's id keeps two schools apart on a shared
 * device.
 */
export function logoUrlFor(schoolId: bigint, logoUpdatedAt: Date | null): string | null {
  return logoUpdatedAt ? `/api/school/logo?v=${schoolId}-${logoUpdatedAt.getTime()}` : null;
}

export interface PupilSchool {
  schoolName: string;
  logoUrl: string | null;
  person: string;
}

/** What a school's pupil sees at the top of a page; null for anyone else. */
export async function pupilSchoolFor(session: Session | null): Promise<PupilSchool | null> {
  if (session?.userType !== "STUDENT") return null;
  const row = await prisma.userProfile.findUnique({
    where: { id: session.userId },
    select: {
      fName: true,
      lName: true,
      profileName: true,
      school: { select: { id: true, name: true, logoUpdatedAt: true } },
    },
  });
  if (!row?.school) return null;
  return {
    schoolName: row.school.name,
    logoUrl: logoUrlFor(row.school.id, row.school.logoUpdatedAt),
    person: displayName(row),
  };
}
