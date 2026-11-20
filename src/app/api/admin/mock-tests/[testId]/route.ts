import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { DIFFICULTY_ORDER } from "@/lib/student";
import { loadPaper } from "@/lib/mock-test";

/**
 * Admin-only: a mock paper's settings.
 *
 * PATCH body: { name, stage, testDate "YYYY-MM-DD", availableDays, breakMinutes,
 * sections: [{ id, durationMinutes }] }. Once any student has started the
 * paper, the break and section times are locked so nobody's test changes
 * under them; the name and dates can still be changed.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const session = await getSessionOrThrow().catch(() => null);
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { testId } = await params;
    if (!/^\d{1,18}$/.test(testId)) return NextResponse.json({ error: "Unknown paper" }, { status: 404 });
    const paper = await loadPaper(BigInt(testId));
    if (!paper) return NextResponse.json({ error: "Unknown paper" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 100) return bad("Enter a name of up to 100 characters");
    const stage = typeof body.stage === "string" && body.stage ? body.stage : null;
    if (stage && !(DIFFICULTY_ORDER as readonly string[]).includes(stage)) return bad("Unknown stage");
    const dateText = typeof body.testDate === "string" ? body.testDate : "";
    const testDate = new Date(`${dateText}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText) || Number.isNaN(testDate.getTime())) return bad("Enter a valid opening date");
    const int = (v: unknown) => (typeof v === "number" ? v : Number(v));
    const availableDays = int(body.availableDays);
    if (!Number.isInteger(availableDays) || availableDays < 1 || availableDays > 365) return bad("Days open must be 1 to 365");
    const breakMinutes = int(body.breakMinutes);
    if (!Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes > 120) return bad("Break must be 0 to 120 minutes");

    const sections: { id: bigint; durationMinutes: number }[] = [];
    for (const s of Array.isArray(body.sections) ? body.sections : []) {
      const section = paper.sections.find((x) => String(x.id) === String(s?.id));
      const minutes = int(s?.durationMinutes);
      if (!section) return bad("Unknown section");
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) return bad("Section times must be 1 to 120 minutes");
      sections.push({ id: section.id, durationMinutes: minutes });
    }

    const timingChanged =
      breakMinutes !== paper.breakMinutes ||
      sections.some((s) => paper.sections.find((x) => x.id === s.id)?.durationMinutes !== s.durationMinutes);
    if (timingChanged && paper._count.attempts > 0) {
      return bad("Students have already started this paper, so the break and section times can no longer change");
    }

    await prisma.$transaction([
      prisma.mockTestGs.update({
        where: { id: paper.id },
        data: { name, stage, testDate, availableDays, breakMinutes },
      }),
      ...sections.map((s) =>
        prisma.mockTestGsSection.update({ where: { id: s.id }, data: { durationMinutes: s.durationMinutes } })
      ),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save mock paper error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
