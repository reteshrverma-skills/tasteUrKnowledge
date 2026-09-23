import { NextResponse } from "next/server";

/**
 * Replaced by /api/comps/[id].
 *
 * English content now lives in gsEnglishComp / gsEnglishQuestions rather than
 * Day / Question. This stub stays so any cached client gets a clear answer
 * instead of a confusing 404; it can be deleted once nothing calls it.
 */
export async function GET() {
  return NextResponse.json(
    { error: "This endpoint has moved to /api/comps/[id]" },
    { status: 410 }
  );
}
