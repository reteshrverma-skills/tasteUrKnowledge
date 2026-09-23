import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const years = await prisma.year.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json(years);
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
    const { name, order } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const year = await prisma.year.create({
      data: {
        name,
        order: order || 0,
      },
    });

    return NextResponse.json(year, { status: 201 });
  } catch (error) {
    console.error("Error creating year:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
