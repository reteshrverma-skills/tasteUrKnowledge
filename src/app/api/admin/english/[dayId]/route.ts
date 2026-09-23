import { NextResponse } from "next/server";

/**
 * Replaced by /api/admin/comps/[compId].
 *
 * Comprehensions are gsEnglishComp rows keyed by an integer id, not Days.
 * These stubs can be deleted once nothing calls them.
 */
const moved = () =>
  NextResponse.json(
    { error: "This endpoint has moved to /api/admin/comps/[compId]" },
    { status: 410 }
  );

export async function GET() {
  return moved();
}

export async function PATCH() {
  return moved();
}

export async function DELETE() {
  return moved();
}
