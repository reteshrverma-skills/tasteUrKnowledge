import { NextRequest, NextResponse } from "next/server";
import { saveChoices, validChoices } from "@/lib/senior-subjects";
import { seniorStudentOrError } from "@/lib/student-account";

/**
 * A GCSE / A-Level student choosing their subjects and the awarding
 * organisation for each. Body: { subjects: [{ subjectCode, boardCode }] },
 * the full list - anything left out is taken off.
 */
export async function PUT(request: NextRequest) {
  const session = await seniorStudentOrError();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json().catch(() => ({}));
    const result = validChoices(session.programme, body.subjects);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    await saveChoices(session.userId, session.programme, result.choices);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save student subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
