import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canonicalLevel } from "@/lib/student";
import {
  GenerationError,
  MAX_GENERATED_QUESTIONS,
  MIN_GENERATED_QUESTIONS,
  generateComprehension,
} from "@/lib/comp-generator";

/** How many existing passages an admin may show Claude as references. */
const MAX_REFERENCES = 3;

/**
 * Drafts an English comprehension with Claude for the admin to review, from
 * the admin's prompt, a difficulty level, chosen reference passages and
 * copyright guidance. It saves nothing: the draft is shown on the admin page,
 * and saving it goes through POST /api/admin/english as an unapproved passage.
 *
 * Writing a long passage and up to 50 questions takes minutes, and Azure App
 * Service drops a request that sends nothing back for about four. So the
 * response streams a space every 15 seconds while Claude writes, then the
 * JSON - leading whitespace is valid JSON, so the browser parses it as usual.
 * Errors after the stream starts are sent as `{ "error": ... }` in the body.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    if (session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI generation is not set up: ANTHROPIC_API_KEY is missing" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const level = canonicalLevel(body.difficultyLevel);
    if (!level) {
      return NextResponse.json(
        { error: "Choose a difficulty level" },
        { status: 400 }
      );
    }

    const count = Number(body.count);
    if (
      !Number.isInteger(count) ||
      count < MIN_GENERATED_QUESTIONS ||
      count > MAX_GENERATED_QUESTIONS
    ) {
      return NextResponse.json(
        {
          error: `Number of questions must be between ${MIN_GENERATED_QUESTIONS} and ${MAX_GENERATED_QUESTIONS}`,
        },
        { status: 400 }
      );
    }

    const year =
      typeof body.yearId === "string"
        ? await prisma.year.findUnique({
            where: { id: body.yearId },
            select: { name: true },
          })
        : null;
    if (!year) {
      return NextResponse.json({ error: "Choose a year" }, { status: 400 });
    }

    const text = (value: unknown, max: number) =>
      typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

    // The admin's prompt. `theme` is the older single-line field.
    const instructions = text(body.instructions, 2000) ?? text(body.theme, 200);
    const copyrightGuidance = text(body.copyrightGuidance, 2000);

    // Existing passages picked as references: read here, by id, so the
    // browser never decides what text Claude is shown.
    const referenceIds: number[] = Array.isArray(body.referenceIds)
      ? body.referenceIds
          .map(Number)
          .filter((id: number) => Number.isSafeInteger(id) && id > 0)
          .slice(0, MAX_REFERENCES)
      : [];

    const [referenceRows, sameLevel] = await Promise.all([
      referenceIds.length
        ? prisma.gsEnglishComp.findMany({
            where: { id: { in: referenceIds } },
            select: {
              label: true,
              difficultyLevel: true,
              compStory: true,
              questions: { select: { typeOfQuestion: true } },
            },
          })
        : Promise.resolve([]),
      // Every title at this level, approved or not, so the draft is distinct.
      prisma.gsEnglishComp.findMany({
        where: { difficultyLevel: { equals: level, mode: "insensitive" } },
        select: { label: true },
        take: 300,
      }),
    ]);

    const references = referenceRows
      .filter((r) => r.compStory?.trim())
      .map((r) => ({
        title: r.label?.trim() || "Untitled",
        level: r.difficultyLevel,
        story: r.compStory!,
        questionTypes: Array.from(
          new Set(
            r.questions
              .map((q) => q.typeOfQuestion?.trim().toLowerCase())
              .filter((t): t is string => Boolean(t))
          )
        ),
      }));
    const avoidTitles = sameLevel
      .map((r) => r.label?.trim())
      .filter((t): t is string => Boolean(t));

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const heartbeat = setInterval(
          () => controller.enqueue(encoder.encode(" ")),
          15_000
        );
        let payload: unknown;
        try {
          const draft = await generateComprehension({
            level,
            yearName: year.name,
            count,
            instructions,
            references,
            copyrightGuidance,
            avoidTitles,
          });
          payload = {
            ...draft,
            // What the draft was steered by, shown beside it on the admin page.
            basis: {
              level,
              yearName: year.name,
              references: references.map((r) => r.title),
            },
          };
        } catch (error) {
          console.error("Generate comprehension error:", error);
          payload = {
            error:
              error instanceof GenerationError
                ? error.message
                : error instanceof Anthropic.RateLimitError
                ? "Claude is busy right now. Wait a minute and try again."
                : error instanceof Anthropic.AuthenticationError
                ? "The Anthropic API key was rejected. Check ANTHROPIC_API_KEY."
                : "Generation failed. Please try again.",
          };
        } finally {
          clearInterval(heartbeat);
        }
        controller.enqueue(encoder.encode(JSON.stringify(payload)));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Generate comprehension error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
