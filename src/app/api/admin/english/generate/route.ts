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

/**
 * Drafts an English comprehension with Claude for the admin to review. It
 * saves nothing: the admin edits the draft and saves it through the normal
 * create form.
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

    const theme =
      typeof body.theme === "string" ? body.theme.trim().slice(0, 200) : null;

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const heartbeat = setInterval(
          () => controller.enqueue(encoder.encode(" ")),
          15_000
        );
        let payload: unknown;
        try {
          payload = await generateComprehension({
            level,
            yearName: year.name,
            count,
            theme,
          });
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
