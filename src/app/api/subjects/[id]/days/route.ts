import { NextResponse } from "next/server";

/**
 * Replaced by reading gsEnglishComp directly (see the subject dashboard page).
 *
 * Comprehensions are matched by yearName / subjectName rather than by a
 * subject foreign key. This stub can be deleted once nothing calls it.
 */
export async function GET() {
  return NextResponse.json(
    { error: "This endpoint has been replaced by gsEnglishComp lookups" },
    { status: 410 }
  );
}
