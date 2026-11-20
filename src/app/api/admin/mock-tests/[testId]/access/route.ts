import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";

/** At most this many students per request ("Add all" on a large school). */
const MAX_IDS = 5000;

function ids(value: unknown): bigint[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_IDS) return null;
  if (!value.every((v) => typeof v === "string" && /^\d{1,18}$/.test(v))) return null;
  return [...new Set(value as string[])].map((v) => BigInt(v));
}

/**
 * Admin-only: give students access to a mock paper, or take it away.
 * Body: { add?: string[], remove?: string[] } - student ids.
 *
 * Only active students on the paper's programme can be added. Taking access
 * away sets revokedAt (rows are never deleted) and is refused for anyone who
 * has already started the paper, so nobody is cut off mid-test; those are
 * returned in `kept`.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const session = await getSessionOrThrow().catch(() => null);
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { testId } = await params;
    if (!/^\d{1,18}$/.test(testId)) return NextResponse.json({ error: "Unknown paper" }, { status: 404 });
    const id = BigInt(testId);
    const paper = await prisma.mockTestGs.findUnique({ where: { id }, select: { programmeCode: true } });
    if (!paper) return NextResponse.json({ error: "Unknown paper" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const add = ids(body.add);
    const remove = ids(body.remove);
    if (!add || !remove) return NextResponse.json({ error: "Invalid student list" }, { status: 400 });

    const adminId = BigInt(session.userId);
    const now = new Date();

    // Adding: only real, active students on this paper's programme.
    const eligible = add.length
      ? await prisma.userProfile.findMany({
          where: { id: { in: add }, userType: "STUDENT", isActive: true, programmeCode: paper.programmeCode },
          select: { id: true },
        })
      : [];

    // Removing: never from a student who has started the paper.
    const started = remove.length
      ? await prisma.mockTestAttempt.findMany({
          where: { testId: id, studentId: { in: remove } },
          select: { studentId: true },
          distinct: ["studentId"],
        })
      : [];
    const startedIds = new Set(started.map((s) => s.studentId));
    const removable = remove.filter((s) => !startedIds.has(s));

    const addIds = eligible.map((s) => s.id);
    await prisma.$transaction([
      // New grants, then re-open any that were withdrawn before.
      prisma.mockTestAccess.createMany({
        data: addIds.map((studentId) => ({ testId: id, studentId, grantedAt: now, grantedBy: adminId })),
        skipDuplicates: true,
      }),
      prisma.mockTestAccess.updateMany({
        where: { testId: id, studentId: { in: addIds }, revokedAt: { not: null } },
        data: { revokedAt: null, revokedBy: null, grantedAt: now, grantedBy: adminId },
      }),
      prisma.mockTestAccess.updateMany({
        where: { testId: id, studentId: { in: removable }, revokedAt: null },
        data: { revokedAt: now, revokedBy: adminId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      added: eligible.map((s) => String(s.id)),
      removed: removable.map(String),
      kept: [...startedIds].map(String),
    });
  } catch (error) {
    console.error("Mock access error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
