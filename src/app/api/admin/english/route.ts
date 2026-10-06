import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { DIFFICULTY_ORDER, canonicalLevel } from "@/lib/student";
import {
  ENGLISH_SUBJECT_NAME,
  compWhere,
  toQuestionData,
  validateQuestions,
  type QuestionInput,
} from "@/lib/english";

const compInclude = {
  questions: { orderBy: { id: "asc" } },
} as const;

/**
 * Comprehensions, optionally narrowed to one year with `?yearId=`.
 * gsEnglishComp stores the year by name, so the id is resolved first.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const yearId = request.nextUrl.searchParams.get("yearId");

    let yearName: string | null = null;
    if (yearId) {
      const year = await prisma.year.findUnique({
        where: { id: yearId },
        select: { name: true },
      });
      // An unknown year has no comprehensions rather than all of them.
      if (!year) {
        return NextResponse.json([]);
      }
      yearName = year.name;
    }

    const comps = await prisma.gsEnglishComp.findMany({
      where: compWhere(yearName, ENGLISH_SUBJECT_NAME),
      include: compInclude,
      orderBy: { id: "asc" },
    });

    return NextResponse.json(comps);
  } catch (error) {
    console.error("Error listing comprehensions:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** Creates a comprehension and its questions together, so neither half-saves. */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { yearId, title, story, difficultyLevel, questions } = body as {
      yearId?: string;
      title?: string;
      story?: string;
      difficultyLevel?: string;
      questions?: QuestionInput[];
    };

    if (!yearId) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Comprehension title is required" },
        { status: 400 }
      );
    }
    if (!story?.trim()) {
      return NextResponse.json(
        { error: "Comprehension story is required" },
        { status: 400 }
      );
    }

    const level = difficultyLevel?.trim()
      ? canonicalLevel(difficultyLevel)
      : undefined;
    if (level === null) {
      return NextResponse.json(
        { error: `Difficulty must be one of ${DIFFICULTY_ORDER.join(", ")}` },
        { status: 400 }
      );
    }

    const questionError = validateQuestions(questions);
    if (questionError) {
      return NextResponse.json({ error: questionError }, { status: 400 });
    }

    const year = await prisma.year.findUnique({
      where: { id: yearId },
      select: { name: true },
    });
    if (!year) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    // Titles are not unique in the database, so the clash is caught here.
    const duplicate = await prisma.gsEnglishComp.findFirst({
      where: {
        ...compWhere(year.name, ENGLISH_SUBJECT_NAME),
        label: { equals: title.trim(), mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "A comprehension with this title already exists for this year" },
        { status: 409 }
      );
    }

    const comp = await prisma.gsEnglishComp.create({
      data: {
        label: title.trim(),
        compStory: story.trim(),
        yearName: year.name,
        subjectName: ENGLISH_SUBJECT_NAME,
        difficultyLevel: level ?? null,
        questions: {
          create: questions!.map((question) => toQuestionData(question)),
        },
      },
      include: compInclude,
    });

    return NextResponse.json(comp, { status: 201 });
  } catch (error) {
    console.error("Error creating comprehension:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
