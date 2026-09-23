import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const days = await prisma.day.findMany({
      include: {
        subject: {
          select: {
            name: true,
            year: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(days);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { label, subjectId, content, order } = body;

    if (!label || !subjectId) {
      return NextResponse.json(
        { error: "Label and subjectId are required" },
        { status: 400 }
      );
    }

    const day = await prisma.day.create({
      data: {
        label,
        subjectId,
        // Optional comprehension story shown above the questions.
        content: content?.trim() ? content.trim() : null,
        order: order || 0,
      },
      include: {
        subject: {
          select: {
            name: true,
            year: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(day, { status: 201 });
  } catch (error) {
    console.error("Error creating day:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
