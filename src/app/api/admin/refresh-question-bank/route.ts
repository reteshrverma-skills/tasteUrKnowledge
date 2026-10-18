import { getSession } from "@/lib/auth";
import { clearBankCache } from "@/lib/bank-cache";

/**
 * Admin-only: drops the cached question-bank lists (levels and topics for
 * Maths, Verbal and Non-Verbal), so questions just loaded by SQL show on the
 * pickers straight away instead of after the 03:00 UK flush.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.userType !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const cleared = clearBankCache();
  return Response.json({ refreshed: true, cleared });
}
