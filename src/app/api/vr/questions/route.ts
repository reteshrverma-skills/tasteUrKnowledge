import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { allowedLevels, canAccessLevel, randomVrRound } from "@/lib/vr";

/**
 * A round of Verbal Reasoning questions, drawn at random: one subtopic of a
 * topic, or the whole topic when no subtopic is given. The answer and the
 * explanations are withheld until the round is submitted.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();

    const params = request.nextUrl.searchParams;
    const level = params.get("level")?.trim() ?? "";
    const topic = params.get("topic")?.trim() || null;
    const subTopic = params.get("subTopic")?.trim() || null;

    if (!level || (!topic && !subTopic)) {
      return NextResponse.json(
        { error: "Choose a difficulty and a topic" },
        { status: 400 }
      );
    }

    // A locked level must not be reachable by typing the query string.
    if (!canAccessLevel(await allowedLevels(session), level)) {
      return NextResponse.json(
        { error: "That difficulty level is not open to you" },
        { status: 403 }
      );
    }

    const questions = await randomVrRound(session.programme, level, topic, subTopic);
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions for that selection and difficulty" },
        { status: 404 }
      );
    }

    return NextResponse.json({ topic, subTopic, level, questions });
  } catch (error) {
    console.error("Get VR questions error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
