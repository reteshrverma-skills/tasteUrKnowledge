import { NextResponse } from "next/server";

/**
 * Replaced by /api/comps/[id]/submit.
 *
 * Attempts are now recorded against a comprehension (gsEngCompId) and answers
 * against gsEnglishQuestions, so the old day-based payload can no longer be
 * graded. This stub can be deleted once nothing calls it.
 */
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has moved to /api/comps/[id]/submit" },
    { status: 410 }
  );
}
