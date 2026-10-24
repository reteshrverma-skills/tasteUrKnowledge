import { prisma } from "@/lib/prisma";
import { DEFAULT_PROGRAMME, type Session } from "@/lib/auth";

/**
 * Programmes - Grammar School (11+), GCSE, A-Level - share one database.
 * Every child and every piece of content has a programmeCode, and every
 * student query filters on it, so a child only ever sees their own
 * programme's questions. The code rides in the login token, so knowing it
 * costs no extra query.
 */

export { DEFAULT_PROGRAMME };

export interface ProgrammeOption {
  code: string;
  name: string;
  /** False: listed as "coming soon" and cannot be chosen yet. */
  available: boolean;
}

/** The programme whose content this visitor sees. */
export function programmeOf(session: Session | null): string {
  return session?.programme || DEFAULT_PROGRAMME;
}

/** The `where` fragment every content query spreads in. */
export function inProgramme(programme: string) {
  return { programmeCode: programme };
}

/**
 * Every programme, for the "Preparing for" choice. Inactive ones (no content
 * yet) come back with available: false and show as "coming soon".
 */
export async function listProgrammes(): Promise<ProgrammeOption[]> {
  const rows = await prisma.programme.findMany({
    select: { code: true, name: true, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({ code: r.code, name: r.name, available: r.isActive }));
}

/** The stored code for a submitted programme, or null if not an active one. */
export async function validProgrammeCode(value: unknown): Promise<string | null> {
  if (typeof value !== "string" || !value.trim()) return null;
  const found = await prisma.programme.findFirst({
    where: { code: value.trim().toUpperCase(), isActive: true },
    select: { code: true },
  });
  return found?.code ?? null;
}
