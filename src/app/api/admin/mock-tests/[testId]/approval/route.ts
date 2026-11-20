import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { loadPaper, paperProblems } from "@/lib/mock-test";

/**
 * Admin-only: approve a mock paper (students can then see it while it is
 * open) or withdraw approval. Body: { approve: boolean }.
 *
 * Approving re-runs every readiness check on the server. Withdrawing is
 * refused once a student has started the paper, so nobody is cut off mid-test.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
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
    const approve = body.approve === true;

    if (approve) {
      const problems = await paperProblems(paper);
      if (problems.length > 0) {
        return NextResponse.json({ error: "This paper is not ready", problems }, { status: 400 });
      }
    } else if (paper._count.attempts > 0) {
      return NextResponse.json(
        { error: "Students have already started this paper, so it cannot be withdrawn" },
        { status: 400 }
      );
    }

    await prisma.mockTestGs.update({
      where: { id: paper.id },
      data: { approvedByAdmin: approve, approvedByAdminDate: approve ? new Date() : null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mock paper approval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
