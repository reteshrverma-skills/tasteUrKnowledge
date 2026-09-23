import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";

/** Updates a day's label, story content and/or order. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { label, content, order } = body;

    if (label !== undefined && !String(label).trim()) {
      return NextResponse.json(
        { error: "Label cannot be empty" },
        { status: 400 }
      );
    }

    const day = await prisma.day.update({
      where: { id },
      data: {
        ...(label !== undefined ? { label: String(label).trim() } : {}),
        // An empty story clears the field rather than storing blank text.
        ...(content !== undefined
          ? { content: String(content).trim() || null }
          : {}),
        ...(order !== undefined ? { order: Number(order) } : {}),
      },
      include: {
        subject: {
          select: {
            name: true,
            year: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(day);
  } catch (error) {
    console.error("Error updating day:", error);
    return NextResponse.json(
      { error: "Failed to update day" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.day.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting day:", error);
    return NextResponse.json(
      { error: "Failed to delete day" },
      { status: 500 }
    );
  }
}
