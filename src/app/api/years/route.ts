import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await getSessionOrThrow();

    const years = await prisma.year.findMany({
      include: {
        subjects: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(years, { status: 200 });
  } catch (error) {
    console.error("Get years error:", error);
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}
