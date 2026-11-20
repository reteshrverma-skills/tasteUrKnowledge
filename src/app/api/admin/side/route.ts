import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { adminSideFigures, canSeeAdminSide } from "@/app/admin/AdminCard";

/**
 * The admin left column's figures, fetched after each move between admin
 * pages so the numbers stay current without redrawing the column.
 * Admins and product directors only.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!canSeeAdminSide(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const figures = await adminSideFigures();
    if (!figures) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(figures, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin side figures error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
