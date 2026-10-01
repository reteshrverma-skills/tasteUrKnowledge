import { NextRequest } from "next/server";
import { listAccounts, resetAccountPassword } from "@/lib/admin-password";

/**
 * Admin-only: reset a PARENT's password. Pinned to the PARENT role, so this
 * endpoint can never change an admin or student account.
 */
export async function GET() {
  const parents = await listAccounts("PARENT").catch(() => null);
  if (!parents) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return Response.json(parents, { status: 200 });
}

export async function POST(request: NextRequest) {
  return resetAccountPassword(request, "PARENT");
}
