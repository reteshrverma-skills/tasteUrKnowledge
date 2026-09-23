import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subjects = await prisma.subject.findMany({
      include: {
        year: {
          select: { name: true },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(subjects);
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
    const { name, yearId, order } = body;

    if (!name || !yearId) {
      return NextResponse.json(
        { error: "Name and yearId are required" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        yearId,
        order: order || 0,
      },
      include: {
        year: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
