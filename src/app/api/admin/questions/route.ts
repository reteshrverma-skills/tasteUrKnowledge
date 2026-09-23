import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const questions = await prisma.question.findMany({
      include: {
        day: {
          select: {
            label: true,
            subject: {
              select: {
                name: true,
                year: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(questions);
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
    const { text, optionA, optionB, optionC, optionD, correctOption, dayId, order } = body;

    if (!text || !optionA || !optionB || !optionC || !optionD || !correctOption || !dayId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const question = await prisma.question.create({
      data: {
        text,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        dayId,
        order: order || 0,
      },
      include: {
        day: {
          select: {
            label: true,
            subject: {
              select: {
                name: true,
                year: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
