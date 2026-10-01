import { NextRequest } from "next/server";
import { listAccounts, resetAccountPassword } from "@/lib/admin-password";

/**
 * Admin-only: reset an ADMIN's password. Pinned to the ADMIN role.
 *
 * Reset-any-admin was a deliberate choice: there is no current-password check,
 * so one admin can reset another's login - convenient for a small team, but it
 * means an admin session is enough to change any admin password. Fine while
 * there is effectively one admin; revisit if the admin group ever grows.
 */
export async function GET() {
  const admins = await listAccounts("ADMIN").catch(() => null);
  if (!admins) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return Response.json(admins, { status: 200 });
}

export async function POST(request: NextRequest) {
  return resetAccountPassword(request, "ADMIN");
}
