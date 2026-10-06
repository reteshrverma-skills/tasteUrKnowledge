import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { DIFFICULTY_ORDER, canonicalLevel } from "@/lib/student";

const compInclude = {
  questions: { orderBy: { id: "asc" } },
} as const;

async function requireAdmin() {
  const session = await getSessionOrThrow();
  return session.userType === "ADMIN";
}

/** Returns the comprehension id, or null when the segment is not a number. */
function parseCompId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { compId } = await params;
    const id = parseCompId(compId);
    if (id === null) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    const comp = await prisma.gsEnglishComp.findUnique({
      where: { id },
      include: compInclude,
    });

    if (!comp) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(comp);
  } catch (error) {
    console.error("Error loading comprehension:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** Updates the title, story and/or difficulty. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { compId } = await params;
    const id = parseCompId(compId);
    if (id === null) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    const existing = await prisma.gsEnglishComp.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, story, difficultyLevel } = body as {
      title?: string;
      story?: string;
      difficultyLevel?: string;
    };

    const level =
      difficultyLevel === undefined || !difficultyLevel.trim()
        ? difficultyLevel
        : canonicalLevel(difficultyLevel);
    if (level === null) {
      return NextResponse.json(
        { error: `Difficulty must be one of ${DIFFICULTY_ORDER.join(", ")}` },
        { status: 400 }
      );
    }

    if (title !== undefined && !title.trim()) {
      return NextResponse.json(
        { error: "Comprehension title cannot be empty" },
        { status: 400 }
      );
    }
    if (story !== undefined && !story.trim()) {
      return NextResponse.json(
        { error: "Comprehension story cannot be empty" },
        { status: 400 }
      );
    }

    if (title !== undefined) {
      const duplicate = await prisma.gsEnglishComp.findFirst({
        where: {
          id: { not: id },
          yearName: existing.yearName,
          subjectName: existing.subjectName,
          label: { equals: title.trim(), mode: "insensitive" },
        },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          {
            error:
              "A comprehension with this title already exists for this year",
          },
          { status: 409 }
        );
      }
    }

    const comp = await prisma.gsEnglishComp.update({
      where: { id },
      data: {
        ...(title !== undefined ? { label: title.trim() } : {}),
        ...(story !== undefined ? { compStory: story.trim() } : {}),
        ...(level !== undefined ? { difficultyLevel: level || null } : {}),
      },
      include: compInclude,
    });

    return NextResponse.json(comp);
  } catch (error) {
    console.error("Error updating comprehension:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** Deletes the comprehension; questions, attempts and answers cascade away. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { compId } = await params;
    const id = parseCompId(compId);
    if (id === null) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    const existing = await prisma.gsEnglishComp.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Comprehension not found" },
        { status: 404 }
      );
    }

    await prisma.gsEnglishComp.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comprehension:", error);
    return NextResponse.json(
      { error: "Failed to delete comprehension" },
      { status: 500 }
    );
  }
}
