import { NextRequest, NextResponse } from "next/server";

/**
 * Logging out is a plain form POST from the dashboard, with no JavaScript to
 * follow up, so the browser simply renders whatever comes back. Returning JSON
 * left the student looking at {"success":true} on a blank page; a 303 sends
 * them to the login form instead.
 *
 * The cookie is cleared on the response itself, with the same name and path
 * login set it with. Clearing it any other way risks the redirect arriving at
 * /login still carrying a valid token - and the proxy bounces a logged-in
 * visitor straight back to /dashboard, which would look like logout silently
 * doing nothing.
 */
export function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });

  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
