import { NextResponse } from "next/server";
import { listCountries } from "@/lib/countries";

/**
 * The country list for the drop-downs. Public, because the sign-up form shows
 * it before anyone is logged in; it holds nothing private. Browsers may keep
 * it for an hour, since the list almost never changes.
 */
export async function GET() {
  try {
    const countries = await listCountries();
    return NextResponse.json(countries, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    console.error("List countries error:", error);
    return NextResponse.json({ error: "Could not load countries" }, { status: 500 });
  }
}
