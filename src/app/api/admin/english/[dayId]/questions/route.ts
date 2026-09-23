import { NextResponse } from "next/server";

/**
 * Replaced by /api/admin/comps/[compId]/questions.
 * This stub can be deleted once nothing calls it.
 */
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has moved to /api/admin/comps/[compId]/questions" },
    { status: 410 }
  );
}
