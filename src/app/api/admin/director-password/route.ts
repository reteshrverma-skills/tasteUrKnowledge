import { NextRequest } from "next/server";
import { listAccounts, resetAccountPassword } from "@/lib/admin-password";

/**
 * Admin-only: reset a Product Director's password. Pinned to the
 * PRODUCT_DIRECTOR role, so it can never change another kind of account.
 */
export async function GET() {
  const directors = await listAccounts("PRODUCT_DIRECTOR").catch(() => null);
  if (!directors) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return Response.json(directors, { status: 200 });
}

export async function POST(request: NextRequest) {
  return resetAccountPassword(request, "PRODUCT_DIRECTOR");
}
