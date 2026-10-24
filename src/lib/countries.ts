import { prisma } from "@/lib/prisma";

/** One choice in a country drop-down. */
export interface CountryOption {
  code: string;
  name: string;
  dialCode: string | null;
}

/** Pre-selected on the forms; also first in the list (sortOrder 1). */
export const DEFAULT_COUNTRY_CODE = "GB";

/** Every country a form may offer: the United Kingdom first, then A-Z. */
export async function listCountries(): Promise<CountryOption[]> {
  return prisma.country.findMany({
    where: { isActive: true },
    select: { code: true, name: true, dialCode: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

/**
 * The stored form of a submitted country code, or null when it is missing or
 * not an active country - so a hand-edited request cannot save anything else.
 */
export async function validCountryCode(value: unknown): Promise<string | null> {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  const found = await prisma.country.findFirst({
    where: { code, isActive: true },
    select: { code: true },
  });
  return found?.code ?? null;
}
